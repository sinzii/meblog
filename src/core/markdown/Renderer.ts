export default abstract class Renderer {
    /**
     * Render markdown to html
     * @param markdown
     * @return html
     */
    abstract render(markdown: string): string;
}
