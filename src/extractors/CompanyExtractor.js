class CompanyExtractor {

    async extract(page) {

        return await page.evaluate(() => {

            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.innerText.trim() : null;
            };

            const getAllText = (selector) => {
                return [...document.querySelectorAll(selector)]
                    .map(el => el.innerText.trim())
                    .filter(Boolean);
            };

            const getMeta = (name) => {
                const meta = document.querySelector(`meta[name="${name}"]`);
                return meta ? meta.content.trim() : null;
            };

            // -------------------------
            // Company Name
            // -------------------------

            const companyName =
                getText("header .logo") ||
                getText(".logo") ||
                getMeta("application-name") ||
                document.title;

            // -------------------------
            // About
            // -------------------------

            const about =
                getText(".about") ||
                getText("#about") ||
                getText(".about-us") ||
                getMeta("description");

            // -------------------------
            // Emails
            // -------------------------

            const emails = [
                ...new Set(
                    (
                        document.body.innerText.match(
                            /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
                        ) || []
                    )
                )
            ];

            // -------------------------
            // Phones
            // -------------------------

            const phones = [
                ...new Set(
                    (
                        document.body.innerText.match(
                            /\+?\d[\d\s\-()]{8,}/g
                        ) || []
                    )
                )
            ];

            // -------------------------
            // Address
            // -------------------------

            const address =
                getText("address") ||
                getText(".address") ||
                getText(".contact-address");

            // -------------------------
            // Social Links
            // -------------------------

            const socialLinks = {};

            [...document.links].forEach(link => {

                const href = link.href;

                if (href.includes("facebook.com"))
                    socialLinks.facebook = href;

                if (href.includes("instagram.com"))
                    socialLinks.instagram = href;

                if (href.includes("linkedin.com"))
                    socialLinks.linkedin = href;

                if (href.includes("twitter.com") || href.includes("x.com"))
                    socialLinks.twitter = href;

                if (href.includes("youtube.com"))
                    socialLinks.youtube = href;

            });

            // -------------------------
            // Contact Page
            // -------------------------

            const contactPage =
                [...document.links]
                    .find(link =>
                        /contact/i.test(link.innerText)
                    )?.href || null;

            // -------------------------
            // Business Hours
            // -------------------------

            const businessHours =
                getText(".business-hours") ||
                getText(".opening-hours") ||
                getText(".hours");

            return {

                companyName,

                about,

                emails,

                phones,

                address,

                businessHours,

                contactPage,

                socialLinks

            };

        });

    }

}

export default CompanyExtractor;