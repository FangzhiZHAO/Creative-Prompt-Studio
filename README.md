# Creative Prompt Studio

A lightweight browser app for:

- analyzing existing text-to-image or text/image-to-video prompts
- building cleaner prompts with structured sections

## What it does

- uses an LLM API to classify pasted prompts into subject, scene, style, composition, lighting, motion, camera, transitions, reference, and negative prompt
- keeps a local fallback parser if the API request fails
- lets you move analyzed prompt parts into the builder
- shows both a highlighted prompt view and a clean plain-text prompt

## Use it

Open the app at [fangzhizhao.github.io/Creative-Prompt-Studio](https://fangzhizhao.github.io/Creative-Prompt-Studio/) — no install needed.

## LLM setup

Inside the app, open `LLM Settings` and provide:

- an OpenAI-compatible chat completions endpoint
- a model name
- an API key

The current default endpoint is `https://api.openai.com/v1/chat/completions`.
