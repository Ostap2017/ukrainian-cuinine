(function () {
    "use strict";

    const root = document.documentElement;
    const pad = (n) => String(n).padStart(2, "0");

    /* ==========================================
       1. Тема: чорна / біла
       ========================================== */
    const themeBtn = document.getElementById("theme-toggle");
    const themeLabel = themeBtn.querySelector(".theme-toggle__label");

    function setTheme(theme) {
        root.setAttribute("data-theme", theme);

        // Підпис показує, на яку тему перейдемо після натискання
        themeLabel.textContent = theme === "dark" ? "Біла тема" : "Чорна тема";
        themeBtn.setAttribute(
            "aria-label",
            theme === "dark" ? "Перемкнути на білу тему" : "Перемкнути на чорну тему"
        );

        try {
            localStorage.setItem("theme", theme);
        } catch (e) {
            /* приватний режим або заблоковане сховище: тема працює без збереження */
        }
    }

    setTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

    themeBtn.addEventListener("click", () => {
        setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });

    /* ==========================================
       2. Годинник: цифровий (HH:MM:SS) + аналоговий циферблат
       ========================================== */
    const digitalEl = document.getElementById("digital-time");
    const dateEl = document.getElementById("digital-date");
    const statusEl = document.getElementById("open-status");
    const hourHand = document.getElementById("hour-hand");
    const minuteHand = document.getElementById("minute-hand");
    const secondHand = document.getElementById("second-hand");

    // Години роботи: [відкриття, закриття] за днем тижня (0 = неділя)
    // Має збігатися з таблицею в розділі «Години роботи»
    const SCHEDULE = {
        0: [11, 21],
        1: [10, 22],
        2: [10, 22],
        3: [10, 22],
        4: [10, 22],
        5: [10, 22],
        6: [11, 23]
    };

    function updateStatus(now) {
        const day = now.getDay();
        const [open, close] = SCHEDULE[day];
        const minutes = now.getHours() * 60 + now.getMinutes();
        const isOpen = minutes >= open * 60 && minutes < close * 60;

        let text;
        if (isOpen) {
            text = `Зараз відчинено · до ${pad(close)}:00`;
        } else if (minutes < open * 60) {
            text = `Зараз зачинено · відкриваємось сьогодні о ${pad(open)}:00`;
        } else {
            const tomorrowOpen = SCHEDULE[(day + 1) % 7][0];
            text = `Зараз зачинено · відкриваємось завтра о ${pad(tomorrowOpen)}:00`;
        }

        statusEl.textContent = text;
        statusEl.classList.toggle("is-open", isOpen);
    }

    let lastMinute = null;

    function tick() {
        const now = new Date();
        const h = now.getHours();
        const m = now.getMinutes();
        const s = now.getSeconds();
        const timeString = `${pad(h)}:${pad(m)}:${pad(s)}`;

        digitalEl.textContent = timeString;
        digitalEl.setAttribute("datetime", timeString);

        dateEl.textContent = now.toLocaleDateString("uk-UA", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        // Стрілки: секундна — 6° за секунду, хвилинна — 6° за хвилину,
        // годинна — 30° за годину. Хвилинна і годинна плавно рухаються разом із секундами.
        secondHand.setAttribute("transform", `rotate(${s * 6} 100 100)`);
        minuteHand.setAttribute("transform", `rotate(${(m + s / 60) * 6} 100 100)`);
        hourHand.setAttribute("transform", `rotate(${((h % 12) + m / 60) * 30} 100 100)`);

        // Статус відчинено оновлюємо раз на хвилину, а не щосекунди
        if (m !== lastMinute) {
            lastMinute = m;
            updateStatus(now);
        }
    }

    tick();
    setInterval(tick, 1000);

    /* ==========================================
       3. Підсвітка сьогоднішнього дня в таблиці годин
       ========================================== */
    const today = new Date().getDay();

    document.querySelectorAll(".hours-table tr[data-days]").forEach((row) => {
        const days = row.dataset.days.split(",").map(Number);
        if (days.includes(today)) {
            row.classList.add("is-today");
        }
    });

    /* ==========================================
       4. Фільтр страв у меню
       ========================================== */
    const filterBtns = document.querySelectorAll(".filter-btn");
    const dishes = document.querySelectorAll(".dish");

    filterBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const filter = btn.dataset.filter;

            filterBtns.forEach((b) => {
                const active = b === btn;
                b.classList.toggle("is-active", active);
                b.setAttribute("aria-pressed", String(active));
            });

            dishes.forEach((dish) => {
                const categories = dish.dataset.category.split(" ");
                dish.hidden = filter !== "all" && !categories.includes(filter);
            });
        });
    });

    /* ==========================================
       5. Підсвітка розділу в меню під час прокрутки
       ========================================== */
    const navLinks = document.querySelectorAll(".site-nav a");

    if ("IntersectionObserver" in window) {
        const sections = [...navLinks]
            .map((a) => document.querySelector(a.getAttribute("href")))
            .filter(Boolean);

        const spy = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const hash = `#${entry.target.id}`;
                    navLinks.forEach((a) => {
                        a.classList.toggle("is-active", a.getAttribute("href") === hash);
                    });
                });
            },
            { rootMargin: "-45% 0px -50% 0px" }
        );

        sections.forEach((section) => spy.observe(section));
    }

    /* ==========================================
       6. Поява блоків при прокрутці
       ========================================== */
    const reveals = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );

        reveals.forEach((el) => revealObserver.observe(el));
    } else {
        reveals.forEach((el) => el.classList.add("is-visible"));
    }

    /* ==========================================
       7. Кнопка «наверх»
       ========================================== */
    const toTopBtn = document.querySelector(".to-top");

    const toggleToTop = () => {
        toTopBtn.classList.toggle("is-shown", window.scrollY > 500);
    };

    window.addEventListener("scroll", toggleToTop, { passive: true });
    toggleToTop();

    toTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    /* ==========================================
       8. Сповіщення та форми
       ========================================== */
    const toast = document.getElementById("toast");
    let toastTimer = null;

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("is-shown");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 3500);
    }

    // Мінімальна дата бронювання: сьогодні за місцевим часом
    const dateInput = document.getElementById("date");
    const localToday = new Date();
    localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
    dateInput.min = localToday.toISOString().slice(0, 10);

    // Бронювання. Тут немає відправки на сервер: підключіть свій обробник або сервіс форм
    document.querySelector(".booking-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!form.reportValidity()) return;

        const name = String(new FormData(form).get("name") || "").trim();
        showToast(`Дякуємо, ${name}! Ми отримали заявку та скоро зв'яжемося з вами.`);
        form.reset();
    });

    // Підписка на новини. Так само без відправки на сервер
    document.querySelector(".newsletter__form").addEventListener("submit", (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!form.reportValidity()) return;

        showToast("Дякуємо за підписку!");
        form.reset();
    });
})();