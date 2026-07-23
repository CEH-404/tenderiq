const hero = document.getElementById("hero");
const scrapePage = document.getElementById("scrape-page");
const startBtn = document.getElementById("start-btn");
const backBtn = document.getElementById("back-btn");
const resetBtn = document.getElementById("reset-btn");

const form = document.getElementById("scrape-form");
const submitBtn = document.getElementById("submit-btn");
const btnLabel = submitBtn.querySelector(".btn-label");
const spinner = submitBtn.querySelector(".spinner");
const formError = document.getElementById("form-error");
const results = document.getElementById("results");

function openScrapePage() {
    hero.hidden = true;
    scrapePage.hidden = false;
}

function showHero() {
    scrapePage.hidden = true;
    hero.hidden = false;
}

startBtn.addEventListener("click", openScrapePage);
backBtn.addEventListener("click", showHero);

resetBtn.addEventListener("click", () => {
    form.reset();
    results.hidden = true;
    showFormError("");
    Object.values(fields).forEach(field => field.classList.remove("invalid"));
    Object.values(errorEls).forEach(el => (el.textContent = ""));
    submitBtn.disabled = true;
    showHero();
});

const fields = {
    url: document.getElementById("url"),
    timeout: document.getElementById("timeout"),
    maxPages: document.getElementById("maxPages"),
    maxDepth: document.getElementById("maxDepth")
};

const errorEls = {
    url: document.getElementById("url-error"),
    timeout: document.getElementById("timeout-error"),
    maxPages: document.getElementById("maxPages-error"),
    maxDepth: document.getElementById("maxDepth-error")
};

function validateField(name) {

    const raw = fields[name].value.trim();

    if (name === "url") {
        if (!raw) return "Website URL is required.";
        if (!/^https?:\/\/.+/i.test(raw)) return "Enter a valid URL starting with http:// or https://";
        return "";
    }

    if (name === "timeout") {
        if (raw === "") return "";
        const value = Number(raw);
        if (!Number.isFinite(value) || value <= 0) return "Timeout must be greater than 0.";
        return "";
    }

    if (name === "maxPages") {
        if (raw === "") return "Maximum pages is required.";
        const value = Number(raw);
        if (!Number.isInteger(value) || value < 1 || value > 500) {
            return "Must be a whole number between 1 and 500.";
        }
        return "";
    }

    if (name === "maxDepth") {
        if (raw === "") return "Crawl depth is required.";
        const value = Number(raw);
        if (!Number.isInteger(value) || value < 0 || value > 10) {
            return "Must be a whole number between 0 and 10.";
        }
        return "";
    }

    return "";
}

function validateForm() {

    let valid = true;

    for (const name of Object.keys(fields)) {

        const message = validateField(name);

        errorEls[name].textContent = message;
        fields[name].classList.toggle("invalid", Boolean(message));

        if (message) valid = false;

    }

    submitBtn.disabled = !valid;

    return valid;

}

Object.keys(fields).forEach(name => {
    fields[name].addEventListener("input", validateForm);
});

function setLoading(isLoading) {

    submitBtn.disabled = isLoading;
    fields.url.disabled = isLoading;
    fields.timeout.disabled = isLoading;
    fields.maxPages.disabled = isLoading;
    fields.maxDepth.disabled = isLoading;

    spinner.hidden = !isLoading;
    btnLabel.textContent = isLoading ? "Scraping..." : "Start Scraping";

}

function showFormError(message) {
    if (!message) {
        formError.hidden = true;
        formError.textContent = "";
        return;
    }
    formError.hidden = false;
    formError.textContent = message;
}

function applyServerErrors(errors) {

    if (!errors) return;

    for (const [name, message] of Object.entries(errors)) {

        if (name === "form") {
            showFormError(message);
            continue;
        }

        if (errorEls[name]) {
            errorEls[name].textContent = message;
            fields[name].classList.add("invalid");
        }

    }

}

form.addEventListener("submit", async event => {

    event.preventDefault();

    if (!validateForm()) return;

    showFormError("");
    results.hidden = true;

    const payload = {
        url: fields.url.value.trim(),
        timeout: fields.timeout.value.trim() === "" ? undefined : Number(fields.timeout.value),
        maxPages: Number(fields.maxPages.value),
        maxDepth: Number(fields.maxDepth.value)
    };

    setLoading(true);

    try {

        const response = await fetch("/api/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            applyServerErrors(data.errors || { form: "Scrape failed." });
            return;
        }

        document.getElementById("stat-pages").textContent = data.pagesScraped ?? "-";
        document.getElementById("stat-duration").textContent = data.stats?.duration ?? "-";
        document.getElementById("stat-errors").textContent = data.stats?.errors ?? "-";

        const excelLink = document.getElementById("download-excel");
        const jsonLink = document.getElementById("download-json");

        if (data.excelAvailable) {
            excelLink.href = "/api/download/excel";
            excelLink.removeAttribute("aria-disabled");
        } else {
            excelLink.href = "#";
            excelLink.setAttribute("aria-disabled", "true");
        }

        if (data.jsonFilename) {
            jsonLink.href = `/api/download/json/${encodeURIComponent(data.jsonFilename)}`;
            jsonLink.removeAttribute("aria-disabled");
        } else {
            jsonLink.href = "#";
            jsonLink.setAttribute("aria-disabled", "true");
        }

        results.hidden = false;
        results.scrollIntoView({ behavior: "smooth", block: "nearest" });

    } catch (error) {

        showFormError("Could not reach the server. Please try again.");

    } finally {

        setLoading(false);

    }

});
