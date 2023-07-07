import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";

hljs.registerLanguage("json", json);
const form = document.getElementById("form");
const repl = document.getElementById("repl");

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

  const details = document.createElement("details");
  // add a message header to the article
  const summary = document.createElement("summary");
  summary.textContent = expression;
  details.appendChild(summary);
  details.open = true;

  const messagePre = document.createElement("pre");
  const messageCode = document.createElement("code");
  messageCode.textContent = JSON.stringify(result, null, 2);
  messageCode.classList.add("language-json");
  messagePre.appendChild(messageCode);
  details.appendChild(messagePre);

  const article = document.createElement("article");
  article.appendChild(details);

  // add as first child of repl div
  repl.insertBefore(article, repl.firstChild);

  document.querySelectorAll("pre code").forEach((el) => {
    hljs.highlightElement(el);
  });
});

const params = new URLSearchParams(window.location.search);
const expression = params.get("expression");

if (expression) {
  form.expression.value = expression;
  form.dispatchEvent(new Event("submit"));
}
