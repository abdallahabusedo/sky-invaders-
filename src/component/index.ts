export class HealthBar {
    private static Element: HTMLElement = document.querySelector(
        "div#text div#health span#bar"
    );
    private static currentWidth: number = 100;

    public static move(width: number): void {
        if (width >= 0) {
            // Handles any unexpected error
            var id = setInterval(() => {
                if (this.currentWidth <= width) {
                    clearInterval(id);
                } else {
                    this.currentWidth--;
                    this.Element.style.width = this.currentWidth + "%";
                }
            }, 10);
        }
    }
}

export class ScoreBar {
    private static Element: HTMLElement = document.querySelector("div#text div#score span#score");
    static update(val: string) {
        this.Element.innerHTML = val;
    }
}