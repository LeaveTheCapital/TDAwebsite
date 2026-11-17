# Design tokens

`tokens.css` is the single source of design tokens for `midicc.html` and `books.html`. Those stylesheets import it. The home page and `tda.html` do not, so their look stays independent.

Change the main brand colour in one place:

```css
--color-primary: #58f5b5;
```

Subheadings, button background, button border, button hover, and link hover and current-page link colours all follow that token. Headings use `--color-heading`, which mixes a little of the primary into the text colour, so titles pick up the new brand colour too. Button label colour is `--color-button-text`. Surface, border, text, and muted text have their own tokens in the same file.

The Ezeptocore panel keeps its own black and brass colours. Its selected sample ring uses the primary colour.
