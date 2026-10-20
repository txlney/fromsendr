// Work page: opens a project's full email in a scrollable modal.
// Each [data-work-item] can set data-full to an image (.png/.jpg/.webp) or an
// HTML file (loaded in an iframe). Without it, a tall placeholder is shown.
const emailModal = document.getElementById("email-modal");
const emailModalBody = document.getElementById("email-modal-body");
const emailModalTitle = document.getElementById("email-modal-title");

const buildFullEmail = (src, title) => {
    if (!src) {
        const placeholder = document.createElement("div");
        placeholder.className = "email-skeleton email-skeleton-full";
        return placeholder;
    }
    if (/\.html?$/i.test(src)) {
        const frame = document.createElement("iframe");
        frame.src = src;
        frame.title = title;
        frame.className = "w-full h-[80vh] border-0";
        return frame;
    }
    const img = document.createElement("img");
    img.src = src;
    img.alt = title + " (full email)";
    img.className = "w-full block";
    return img;
};

document.querySelectorAll("[data-work-item]").forEach((item) => {
    item.querySelector("[data-open-email]").addEventListener("click", () => {
        const title = item.dataset.title;
        emailModalTitle.textContent = title;
        emailModalBody.replaceChildren(buildFullEmail(item.dataset.full, title));
        emailModal.showModal();
        // Reset after showModal(): scrollTop does nothing on a hidden (display: none) dialog.
        // Both are reset because the dialog itself can also scroll (header + body can exceed its max height).
        emailModal.scrollTop = 0;
        emailModalBody.scrollTop = 0;
        document.body.classList.add("overflow-hidden");
    });
});

const closeEmailModal = () => emailModal.close();
document.getElementById("email-modal-close").addEventListener("click", closeEmailModal);
// Clicking the dimmed backdrop (the dialog element itself) closes it
emailModal.addEventListener("click", (event) => {
    if (event.target === emailModal) closeEmailModal();
});
emailModal.addEventListener("close", () => {
    emailModalBody.replaceChildren();
    document.body.classList.remove("overflow-hidden");
});

// Archive strip: click and drag to scroll with a mouse (touch and trackpads already scroll it
// natively). Dragging only moves the row sideways; each email still scrolls with the wheel.
// Presses on a card's scrollbar are left to the browser.
const archiveStrip = document.querySelector(".archive-strip");

if (archiveStrip) {
    let drag = null;

    // True if the point is on el's scrollbar: client sizes exclude scrollbars
    const onScrollbar = (el, x, y) => {
        const r = el.getBoundingClientRect();
        return x > r.left + el.clientLeft + el.clientWidth || y > r.top + el.clientTop + el.clientHeight;
    };

    archiveStrip.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        const card = event.target.closest(".archive-card");
        if (card && onScrollbar(card, event.clientX, event.clientY)) return;
        drag = { x: event.clientX, y: event.clientY, left: archiveStrip.scrollLeft, moved: false };
        archiveStrip.setPointerCapture(event.pointerId);
    });

    archiveStrip.addEventListener("pointermove", (event) => {
        if (!drag) return;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        // A few pixels of slack, so a plain click doesn't count as a drag
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        if (!drag.moved) {
            drag.moved = true;
            archiveStrip.classList.add("is-dragging");
        }
        archiveStrip.scrollLeft = drag.left - dx;
    });

    const endDrag = () => {
        drag = null;
        archiveStrip.classList.remove("is-dragging");
    };
    archiveStrip.addEventListener("pointerup", endDrag);
    archiveStrip.addEventListener("pointercancel", endDrag);
    // Stop the browser's own image drag (the ghost image) from taking over the gesture
    archiveStrip.addEventListener("dragstart", (event) => event.preventDefault());
}
