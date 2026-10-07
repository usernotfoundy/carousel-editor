# Continuum

Continuum is a browser editor for seamless Instagram carousels.

Most carousel tools treat each slide as its own canvas. Continuum does the opposite: you design one wide canvas, and the app cuts that canvas into individual slides when you export. A photo, a headline, or a shape can sit across a slide boundary and still line up when someone swipes through the post.

## Purpose

Instagram carousels are a sequence of images, but the best ones read as a single picture. Continuum keeps that picture intact while you work, then exports each frame at the exact slide size so the seams match.

The editor is desktop-first, with a floating tool bar on smaller screens. Your project is saved in the browser, so a refresh restores the canvas.

## What you can do

- Choose a portrait (1080×1350), square (1080×1080), or landscape (1080×566) format, and set how many slides the canvas contains.
- Place images, text, and shapes anywhere on the continuous canvas, including across slide guides.
- Move, resize, rotate, and reorder those elements, with undo and redo.
- Preview the carousel one slide at a time.
- Export each slide as its own PNG or JPG and save the files one by one.

Slide guides, selection boxes, and the rest of the editor chrome are only for editing. They are not part of the exported images.

## Run

```bash
npm install
npm run dev
```
