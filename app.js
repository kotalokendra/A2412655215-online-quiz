
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
const studentsFile = path.join(__dirname, "data", "students.json");
const scoresFile = path.join(__dirname, "data", "scores.json");
function ensureFile(filePath) {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf8");
  }
}
ensureFile(studentsFile);
ensureFile(scoresFile);
function readJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    if (!data.trim()) {
      return [];
    }
    const parsedData = JSON.parse(data);
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("Error reading JSON file:", error.message);
    return [];
  }
}
function writeJson(filePath, data) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}
const questions = [
  {
    id: 1,
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Text Machine Language",
      "Hyperlink Text Management Language",
      "Home Tool Markup Language"
    ],
    answer: "Hyper Text Markup Language"
  },
  {
    id: 2,
    question: "Which language is used to style a webpage?",
    options: [
      "HTML",
      "CSS",
      "Node.js",
      "SQL"
    ],
    answer: "CSS"
  },
  {
    id: 3,
    question: "Which command creates a package.json file?",
    options: [
      "node create",
      "npm init",
      "express start",
      "npm build"
    ],
    answer: "npm init"
  },
  {
    id: 4,
    question: "Which framework is used with Node.js to create web applications?",
    options: [
      "Express.js",
      "Django",
      "Spring",
      "Laravel"
    ],
    answer: "Express.js"
  },
  {
    id: 5,
    question: "Which method is used to send data through an HTML form securely from the URL?",
    options: [
      "GET",
      "POST",
      "LINK",
      "FETCH"
    ],
    answer: "POST"
  }
];
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});
app.post("/register", (req, res) => {
  const studentId = String(req.body.studentId || "").trim();
  const studentName = String(req.body.studentName || "").trim();

  if (!studentId || !studentName) {
    return res.status(400).send("Student ID and name are required.");
  }
  const students = readJson(studentsFile);
  const existingStudent = students.find(
    (student) => student.studentId === studentId
  );
  if (existingStudent) {
    return res.send(`
      <h2>Student ID already exists</h2>
      <p>Please use a different Student ID.</p>
      <a href="/register">Go Back</a>
    `);
  }
  const newStudent = {
    studentId: studentId,
    studentName: studentName,
    registeredAt: new Date().toISOString()
  };
  students.push(newStudent);
  writeJson(studentsFile, students);
  res.redirect(
    `/quiz?studentId=${encodeURIComponent(studentId)}`
  );
});
app.get("/quiz", (req, res) => {
  const studentId = String(req.query.studentId || "").trim();
  const students = readJson(studentsFile);
  const student = students.find(
    (item) => item.studentId === studentId
  );
  if (!student) {
    return res.redirect("/register");
  }
  res.sendFile(path.join(__dirname, "views", "quiz.html"));
});
app.get("/api/questions", (req, res) => {
  res.json(questions);
});
app.post("/submit", (req, res) => {
  const studentId = String(req.body.studentId || "").trim();

  const students = readJson(studentsFile);
  const student = students.find(
    (item) => item.studentId === studentId
  );
  if (!student) {
    return res.status(400).send("Student not found.");
  }

  let score = 0;
  questions.forEach((question) => {
    const submittedAnswer = req.body[`question${question.id}`];

    if (submittedAnswer === question.answer) {
      score++;
    }
  });
  const total = questions.length;
  const result = {
    studentId: student.studentId,
    studentName: student.studentName,
    score: score,
    total: total,
    percentage: Number(((score / total) * 100).toFixed(2)),
    submittedAt: new Date().toISOString()
  };
  const scores = readJson(scoresFile);
  scores.push(result);
  writeJson(scoresFile, scores);
  res.redirect(
    `/result?studentName=${encodeURIComponent(student.studentName)}` +
    `&studentId=${encodeURIComponent(student.studentId)}` +
    `&score=${score}&total=${total}`
  );
});
app.get("/result", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "result.html"));
});
app.get("/scores", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "scores.html"));
});
app.get("/api/scores", (req, res) => {
  const scores = readJson(scoresFile);
  res.json(scores);
});
app.use((req, res) => {
  res.status(404).send(`
    <h1>404 - Page Not Found</h1>
    <p>The requested page does not exist.</p>
    <a href="/">Go to Home</a>
  `);
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});