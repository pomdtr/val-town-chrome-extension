import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";

hljs.registerLanguage("json", json);
const form = document.getElementById("form");
const repl = document.getElementById("repl");

const params = new URLSearchParams(window.location.search);
const expression = params.get("expression");

if (expression) {
  form.expression.value = expression;
  form.dispatchEvent(new Event("submit"));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const expression = e.target.expression.value;
  const res = await fetch("https://api.val.town/v1/eval", {
    method: "POST",
    body: JSON.stringify({
      code: expression,
    }),
  });

  const result = await res.json();

  // add an article to the repl div
  const article = document.createElement("article");

  // add a message header to the article
  const messageHeader = document.createElement("header");
  messageHeader.textContent = expression;
  article.appendChild(messageHeader);

  // add a message body to the article
  const messagePre = document.createElement("pre");
  const messageCode = document.createElement("code");
  messageCode.textContent = JSON.stringify(result, null, 2);
  messageCode.classList.add("language-json");
  messagePre.appendChild(messageCode);
  article.appendChild(messagePre);

  // add as first child of repl div
  repl.insertBefore(article, repl.firstChild);

  document.querySelectorAll("pre code").forEach((el) => {
    hljs.highlightElement(el);
  });
});
