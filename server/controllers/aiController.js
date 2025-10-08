import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import PDFParser from "pdf2json";

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

/* ----------------------------- Helper Functions ----------------------------- */

const checkFreeUsage = (plan, free_usage, res) => {
  if (plan !== "premium" && free_usage >= 10) {
    res.status(403).json({
      success: false,
      message: "Limit reached. Upgrade your plan to continue.",
    });
    return false;
  }
  return true;
};

const incrementUsage = async (plan, userId, free_usage) => {
  if (plan !== "premium") {
    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        free_usage: free_usage + 1,
      },
    });
  }
};

const createAIChat = async (prompt, max_tokens = 500, temperature = 0.7) => {
  const response = await AI.chat.completions.create({
    model: "gemini-2.0-flash",
    messages: [{ role: "user", content: prompt }],
    temperature,
    max_tokens,
  });
  return response.choices[0].message.content;
};

/* ----------------------------- Controllers ----------------------------- */

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const { plan, free_usage } = req;

    if (!checkFreeUsage(plan, free_usage, res)) return;

    const content = await createAIChat(prompt, length);

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')
    `;

    await incrementUsage(plan, userId, free_usage);

    res.json({ success: true, content });
  } catch (error) {
    console.error("Article generation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const { plan, free_usage } = req;

    if (!checkFreeUsage(plan, free_usage, res)) return;

    const content = await createAIChat(prompt, 100);

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'blog-title')
    `;

    await incrementUsage(plan, userId, free_usage);

    res.json({ success: true, content });
  } catch (error) {
    console.error("Blog title generation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const { plan } = req;

    if (plan !== "premium") {
      return res
        .status(403)
        .json({ success: false, message: "Premium feature only." });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary"
    ).toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
    `;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("Image generation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const { plan } = req;

    if (plan !== "premium") {
      return res
        .status(403)
        .json({ success: false, message: "Premium feature only." });
    }

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
          background_removal: "remove_the_background",
        },
      ],
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')
    `;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error("Background removal error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const { plan } = req;

    if (plan !== "premium") {
      return res
        .status(403)
        .json({ success: false, message: "Premium feature only." });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path);

    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      resource_type: "image",
    });

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')
    `;

    res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.error("Object removal error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const { plan } = req;

    if (plan !== "premium") {
      return res
        .status(403)
        .json({ success: false, message: "Premium feature only." });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false,
        message: "Resume file size exceeds 5MB.",
      });
    }

    const text = await new Promise((resolve, reject) => {
      const dataBuffer = fs.readFileSync(resume.path);
      const pdfParser = new PDFParser();

      pdfParser.on("pdfParser_dataError", reject);
      pdfParser.on("pdfParser_dataReady", (pdfData) => {
        const extractedText = pdfData?.formImage?.Pages?.map((page) =>
          page.Texts.map((t) =>
            decodeURIComponent(t.R.map((r) => r.T).join(""))
          ).join(" ")
        ).join("\n\n");

        resolve(extractedText || "");
      });

      pdfParser.parseBuffer(dataBuffer);
    });

    if (!text.trim()) {
      return res.json({
        success: false,
        message: "No readable text found in the uploaded PDF.",
      });
    }

    const prompt = `Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement:\n\n${text}`;
    const content = await createAIChat(prompt, 1000);

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')
    `;

    res.json({ success: true, content });
  } catch (error) {
    console.error("Resume review error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
