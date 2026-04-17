const detectLanguage = (code) => {
  const normalized = code.toLowerCase()

const map = [
  { lang: "typescript", signs: ["interface ", ": string", ": number", "<t>", "as ", "implements "] },
  { lang: "javascript", signs: ["const ", "let ", "var ", "=>", "require(", "console.log"] },
  { lang: "python",     signs: ["def ", "import ", "print(", "elif ", "self"] },
  { lang: "java",       signs: ["public class", "system.out", "void main", "new "] },
  { lang: "cpp",        signs: ["#include", "std::", "cout <<", "int main"] },
  { lang: "c",          signs: ["#include", "printf(", "scanf(", "int main"] },
  { lang: "go",         signs: ["func ", "package main", "fmt.println"] },
  { lang: "rust",       signs: ["fn main", "let mut", "println!", "impl "] },
  { lang: "php",        signs: ["<?php", "echo ", "$_get", "$_post"] },
  { lang: "ruby",       signs: ["def ", "end", "puts ", "class "] },
  { lang: "kotlin",     signs: ["fun ", "val ", "var ", "println("] },
  { lang: "swift",      signs: ["func ", "let ", "var ", "print("] },
  { lang: "csharp",     signs: ["using ", "namespace ", "console.writeline", "class "] },
  { lang: "scala",      signs: ["object ", "def ", "println(", "val "] },
  { lang: "shell",      signs: ["#!/bin/bash", "echo ", "ls ", "grep "] },
]

  let scores = {}

  // 🟡 1. keyword scoring
  for (const { lang, signs } of map) {
    scores[lang] = signs.reduce((acc, s) => {
      return acc + (normalized.includes(s) ? 1 : 0)
    }, 0)
  }

  // 🟣 2. indentation → Python boost
  const lines = code.split("\n")
  const indentLines = lines.filter(line => /^\s{2,}/.test(line)).length

  if (indentLines > lines.length * 0.3) {
    scores["python"] = (scores["python"] || 0) + 2
  }

  // 🔵 3. semicolon → JS/Java boost
  const semicolons = (code.match(/;/g) || []).length

  if (semicolons > 3) {
    scores["javascript"] = (scores["javascript"] || 0) + 1
    scores["java"] = (scores["java"] || 0) + 1
  }

  // 🔴 4. braces → C-like languages boost
  const braces = (code.match(/{/g) || []).length

  if (braces > 2) {
    scores["javascript"] += 1
    scores["java"] += 1
    scores["cpp"] += 1
  }

  // 🏆 pick max score
  let detected = "unknown"
  let maxScore = 0

  for (const lang in scores) {
    if (scores[lang] > maxScore) {
      maxScore = scores[lang]
      detected = lang
    }
  }

  return detected
}

module.exports = { detectLanguage }