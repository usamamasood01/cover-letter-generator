const express = require("express");
const cors = require("cors");
const { InferenceClient } = require("@huggingface/inference");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        console.log(`CORS: Allowing request from ${origin}`);
        return callback(null, true);
      }
      console.log(`CORS: Blocking request from ${origin}`);
      return callback(new Error(`CORS policy: ${origin} is not allowed`));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.post("/generate-cover-letter", async (req, res) => {
  const HF_API_KEY = process.env.HF_API_KEY;
  if (!process.env.HF_API_KEY) {
    throw new Error("HF_API_KEY is not defined in environment variables");
  }

  const {
    role,
    resumeData,
    companyName,
    jobDescription,
    hiringManagerName,
    experience,
  } = req.body;

  if (!role || !resumeData || !companyName || !jobDescription || !experience) {
    console.log("Missing required fields in request body");
    return res.status(400).json({ error: "Missing required fields" });
  }

  const formattedResumeData = JSON.stringify(resumeData, null, 2);

  const prompt = `
    You are an expert resume writer. Generate a professional cover letter for a ${role} Developer position at ${companyName}. Use the following exact structure, filling placeholders accurately:

    ---

    Usama Masood
    Lahore, Punjab, Pakistan
    usamamasood28@gmail.com
    +923150449133
    ${new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}

    ${hiringManagerName || "Hiring Manager"}
    ${companyName}

    Dear ${hiringManagerName || "Hiring Manager"},

    I am thrilled to apply for the ${role} Developer position at ${companyName}. With ${experience} of experience in delivering ${role} solutions through test-driven development, I am excited to contribute to ${companyName}’s vision of [insert a company-specific goal from the job description, e.g., "creating innovative digital platforms"].

    Select two relevant achievements from the candidate's resume data below, ensuring quantifiable metrics are used exactly as provided. Highlight skills that align with the job description. Resume data: ${formattedResumeData}. Job description: ${jobDescription}. Example achievements: At AHOM Limited, I led ${role.toLowerCase()} development, achieving 95% test coverage; at Volocopter GmbH, I reduced page load times from over 3s to under 2.5s. These skills in [list 2–3 relevant skills from resume, e.g., React, Node.js, AWS] align with ${companyName}’s focus on [insert a specific detail from job description, e.g., "scalable solutions"].

    I am particularly drawn to ${companyName}’s [insert a specific detail from job description or company research, e.g., "commitment to innovative solutions"]. I am eager to leverage my expertise to support your team’s success.

    Thank you for considering my application. I look forward to discussing how I can contribute to ${companyName}.

    Sincerely,
    Usama Masood

    ---

    Instructions:
    - Use metrics exactly as in the resume (e.g., “95% test coverage”, “3s to 2.5s”).
    - Keep the letter concise (~250–300 words).
    - Select achievements relevant to the ${role} role and job description.
    - Ensure a professional tone and formal language.
    - If hiringManagerName is not provided, use “Hiring Manager”.
    - Do not add or modify any metrics.
    `;

  try {
    const client = new InferenceClient(HF_API_KEY);
    const chatCompletion = await client.chatCompletion({
      model: "HuggingFaceH4/zephyr-7b-beta",
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const coverLetter =
      chatCompletion.choices[0].message || "No content generated";
    res.json({ coverLetter });
  } catch (error) {
    console.error("Error generating cover letter:", error);
    res
      .status(500)
      .json({ error: error?.message || "Failed to generate cover letter" });
  }
});

app.get("/", (req, res) => {
  console.log("Health check requested");
  res.status(200).json({ status: "Server is running" });
});

module.exports = app;
