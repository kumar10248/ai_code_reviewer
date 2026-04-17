// services/language.service.js
const detectLanguage = (code) => {
  const normalized = code.toLowerCase()
  const map = [
    { lang: "typescript", signs: ["interface ", ": string", ": number", "<t>", "tsx"] },
    { lang: "javascript", signs: ["const ", "let ", "var ", "=>", "require(", "console.log"] },
    { lang: "python",     signs: ["def ", "import ", "print(", "elif "] },
    { lang: "java",       signs: ["public class", "system.out", "void main","public"] },
    { lang: "cpp",        signs: ["#include", "std::", "cout <<", "int main"] },
    { lang: "go",         signs: ["func ", "package main", "fmt.println"] },
    { lang: "rust",       signs: ["fn main", "let mut", "println!", "impl "] },
    { lang: "php",        signs: ["<?php", "echo ", "$_get", "$_post"] },
  ]

  for (const { lang, signs } of map) {
    if (signs.some((s) => normalized.includes(s))) return lang
  }

  return "unknown"
}

module.exports = { detectLanguage }