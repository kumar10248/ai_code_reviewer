// services/language.service.js
const detectLanguage = (code) => {
  const map = [
    { lang: "python",     signs: ["def ", "import ", "print(", "elif "] },
    { lang: "javascript", signs: ["const ", "let ", "var ", "=>", "require("] },
    { lang: "typescript", signs: ["interface ", ": string", ": number", "tsx", "<T>"] },
    { lang: "java",       signs: ["public class", "System.out", "void main"] },
    { lang: "cpp",        signs: ["#include", "std::", "cout <<", "int main"] },
    { lang: "go",         signs: ["func ", "package main", "fmt.Println"] },
    { lang: "rust",       signs: ["fn main", "let mut", "println!", "impl "] },
    { lang: "php",        signs: ["<?php", "echo ", "$_GET", "$_POST"] },
  ]

  for (const { lang, signs } of map) {
    if (signs.some((s) => code.includes(s))) return lang
  }

  return "unknown"
}

module.exports = { detectLanguage }