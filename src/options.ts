import { EditorState } from "@codemirror/state";
import { defaultKeymap } from "@codemirror/commands";
import { linter } from "@codemirror/lint";
import { jsonLanguage, jsonParseLinter } from "@codemirror/lang-json";
import {
  EditorView,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";

const { config } = await chrome.storage.local.get(["config"]);

const state = EditorState.create({
  extensions: [
    lineNumbers(),
    linter(jsonParseLinter()),
    highlightActiveLineGutter(),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        try {
          // check if the config is valid JSON
          JSON.parse(update.state.doc.toString());
          chrome.storage.local.set({ config: update.state.doc.toString() });
        } catch (e) {
          // pass
        }
      }
    }),
    keymap.of([...defaultKeymap]),
    jsonLanguage,
    syntaxHighlighting(defaultHighlightStyle),
  ],
  doc: config || JSON.stringify({}, null, 2),
});

new EditorView({
  parent: document.body,
  state,
});
