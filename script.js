
      const defaults = [
        { name: "Move", hint: "ten minutes of movement", kind: "move" },
        { name: "Read", hint: "a few pages, no pressure", kind: "read" },
        { name: "Unwind", hint: "screen-free before sleep", kind: "rest" },
      ];
      let state = JSON.parse(
        localStorage.getItem("rhythm-v2") ||
          localStorage.getItem("rhythm-v1") ||
          "null",
      ) || {
        habits: defaults,
        checks: {},
        mood: null,
        remarks: {},
        delayed: [],
      };
      state.remarks ??= {};
      state.delayed ??= [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let shown = new Date(today.getFullYear(), today.getMonth(), 1);
      const id = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const save = () =>
        localStorage.setItem("rhythm-v2", JSON.stringify(state));
      const count = (k) => (state.checks[k] || []).length;
      function render() {
        let key = id(today),
          done = state.checks[key] || [];
        date.textContent = today.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        });
        countEl.textContent = `${done.length} / ${state.habits.length}`;
        habits.innerHTML = state.habits
          .map(
            (h, i) =>
              `<label class="habit ${done.includes(i) ? "done" : ""}"><input type="checkbox" data-i="${i}" ${done.includes(i) ? "checked" : ""}><span><strong>${h.name}</strong><input class="habit-note" data-habit-note="${i}" value="${h.hint}" aria-label="Description for ${h.name}"></span><i class="dot ${h.kind}"></i></label>`,
          )
          .join("");
        document.querySelectorAll(".habit input[type=checkbox]").forEach(
          (x) =>
            (x.onchange = (e) => {
              let n = +e.target.dataset.i,
                a = state.checks[key] || [];
              state.checks[key] = e.target.checked
                ? [...a, n]
                : a.filter((v) => v !== n);
              save();
              render();
            }),
        );
        document.querySelectorAll("[data-habit-note]").forEach(
          (x) =>
            (x.onchange = () => {
              state.habits[+x.dataset.habitNote].hint =
                x.value.trim() || "A small, meaningful step";
              save();
              render();
            }),
        );
        remarks.value = state.remarks[key] || "";
        delayedList.innerHTML =
          state.delayed
            .map(
              (x, i) =>
                `<div class="chip"><span>${x}</span><button data-remove="${i}" aria-label="Remove delayed work">×</button></div>`,
            )
            .join("") || '<span class="date">Nothing waiting yet.</span>';
        document.querySelectorAll("[data-remove]").forEach(
          (b) =>
            (b.onclick = () => {
              state.delayed.splice(+b.dataset.remove, 1);
              save();
              render();
            }),
        );
        let s = 0,
          d = new Date(today);
        while (count(id(d))) {
          s++;
          d.setDate(d.getDate() - 1);
        }
        streak.textContent = s;
        let days = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
          ).getDate(),
          total = 0;
        for (let i = 1; i <= days; i++)
          total += count(
            id(new Date(today.getFullYear(), today.getMonth(), i)),
          );
        monthPercent.textContent = `${Math.round((total / (days * state.habits.length)) * 100)}%`;
        monthName.textContent = shown.toLocaleDateString(undefined, {
          month: "long",
          year: "numeric",
        });
        let first = new Date(shown),
          pad = (first.getDay() + 6) % 7,
          last = new Date(
            shown.getFullYear(),
            shown.getMonth() + 1,
            0,
          ).getDate(),
          cal = "";
        for (let i = 0; i < pad; i++) cal += '<i class="day empty"></i>';
        for (let n = 1; n <= last; n++) {
          let d = new Date(shown.getFullYear(), shown.getMonth(), n),
            k = id(d);
          cal += `<button class="day ${k === key ? "today" : ""}" data-level="${Math.min(3, count(k))}">${n}</button>`;
        }
        calendar.innerHTML = cal;
        document
          .querySelectorAll("#mood button")
          .forEach((b, i) => b.classList.toggle("selected", state.mood === i));
      }
      const date = document.querySelector("#date"),
        countEl = document.querySelector("#count"),
        habits = document.querySelector("#habits"),
        remarks = document.querySelector("#remarks"),
        delayedList = document.querySelector("#delayedList"),
        calendar = document.querySelector("#calendar"),
        monthName = document.querySelector("#monthName"),
        streak = document.querySelector("#streak"),
        monthPercent = document.querySelector("#monthPercent"),
        settingsButton = document.querySelector("#habitSettings");
      remarks.oninput = () => {
        state.remarks[id(today)] = remarks.value;
        save();
      };
      document.querySelector("#delayedAdd").onclick = () => {
        let v = delayedInput.value.trim();
        if (v) {
          state.delayed.push(v);
          delayedInput.value = "";
          save();
          render();
        }
      };
      document.querySelector("#prev").onclick = () => {
        shown.setMonth(shown.getMonth() - 1);
        render();
      };
      document.querySelector("#next").onclick = () => {
        shown.setMonth(shown.getMonth() + 1);
        render();
      };
      document.querySelectorAll("#mood button").forEach(
        (b, i) =>
          (b.onclick = () => {
            state.mood = i;
            save();
            render();
          }),
      );
      function renderManager() {
        habitManager.innerHTML = state.habits
          .map(
            (h, i) =>
              `<div class="chip"><span><input data-rename="${i}" value="${h.name}" aria-label="Habit name"><input data-hint="${i}" value="${h.hint}" aria-label="Habit description"></span><button data-delete="${i}" aria-label="Remove ${h.name}">×</button></div>`,
          )
          .join("");
        document.querySelectorAll("[data-rename]").forEach(
          (x) =>
            (x.onchange = () => {
              state.habits[+x.dataset.rename].name = x.value.trim() || "Habit";
              save();
              render();
              renderManager();
            }),
        );
        document.querySelectorAll("[data-hint]").forEach(
          (x) =>
            (x.onchange = () => {
              state.habits[+x.dataset.hint].hint =
                x.value.trim() || "A small, meaningful step";
              save();
              render();
              renderManager();
            }),
        );
        document.querySelectorAll("[data-delete]").forEach(
          (b) =>
            (b.onclick = () => {
              let n = +b.dataset.delete;
              state.habits.splice(n, 1);
              Object.keys(state.checks).forEach(
                (k) =>
                  (state.checks[k] = (state.checks[k] || [])
                    .filter((v) => v !== n)
                    .map((v) => (v > n ? v - 1 : v))),
              );
              save();
              render();
              renderManager();
            }),
        );
      }
      add.onclick = () => {
        let n = prompt("Habit name");
        if (n) {
          state.habits.push({
            name: n,
            hint: "a small, meaningful step",
            kind: "move",
          });
          save();
          render();
        }
      };
      settingsButton.onclick = () => {
        modal.hidden = false;
        renderManager();
      };
      closeModal.onclick = () => (modal.hidden = true);
      newHabit.onclick = () => {
        let n = prompt("Habit name");
        if (n) {
          state.habits.push({
            name: n,
            hint: "a small, meaningful step",
            kind: "move",
          });
          save();
          render();
          renderManager();
        }
      };
      render();
      const weekly = document.createElement("article");
      weekly.className = "card";
      weekly.style.gridColumn = "1/-1";
      weekly.innerHTML =
        '<div class="row"><h2>Weekly progress</h2><b id="weekRate">0%</b></div><div id="weekBars" class="week-bars" role="img" aria-label="Habit completion for the last seven days"></div>';
      document.querySelector(".journal").before(weekly);
      const weeklyStyle = document.createElement("style");
      weeklyStyle.textContent =
        '.week-bars{display:grid;grid-template-columns:repeat(7,1fr);gap:10px;align-items:end;height:130px}.week-bar{height:100%;display:flex;flex-direction:column;justify-content:end;align-items:center;gap:7px;font:11px "Trebuchet MS",sans-serif;color:var(--muted)}.week-bar i{display:block;width:100%;max-width:38px;min-height:3px;background:var(--moss);border-radius:8px 8px 3px 3px}.week-bar b{font-weight:400;color:var(--ink)}';
      document.head.append(weeklyStyle);
      function updateWeek() {
        let days = Array.from({ length: 7 }, (_, i) => {
            let d = new Date(today);
            d.setDate(d.getDate() - 6 + i);
            return d;
          }),
          total = days.reduce((s, d) => s + count(id(d)), 0),
          possible = 7 * state.habits.length;
        document.querySelector("#weekRate").textContent = possible
          ? `${Math.round((total / possible) * 100)}%`
          : "";
        document.querySelector("#weekBars").innerHTML = days
          .map((d) => {
            let n = count(id(d)),
              pct = state.habits.length ? (n / state.habits.length) * 100 : 0;
            return `<div class="week-bar" aria-label="${d.toLocaleDateString(undefined, { weekday: "long" })}: ${n} habits"><b>${n}</b><i style="height:${pct}%"></i><span>${d.toLocaleDateString(undefined, { weekday: "short" })}</span></div>`;
          })
          .join("");
      }
      const originalRender = render;
      render = () => {
        originalRender();
        updateWeek();
      };
      updateWeek();
      const review = document.createElement("div");
      review.className = "modal";
      review.hidden = true;
      review.innerHTML =
        '<div class="modal-box"><div class="row"><h2 id="reviewTitle">Day review</h2><button id="reviewClose" class="under">Close</button></div><p id="reviewSummary" class="sub"></p><div id="reviewHabits" class="delayed-list" style="margin-top:16px"></div><div style="margin-top:18px"><h2>Remark</h2><p id="reviewRemark" class="sub" style="white-space:pre-wrap;margin-top:8px"></p></div></div>';
      document.body.append(review);
      document.head.append(
        Object.assign(document.createElement("style"), {
          textContent:
            '.review-done{color:var(--moss)}.review-empty{color:var(--muted);font-family:"Trebuchet MS",sans-serif;font-size:13px}',
        }),
      );
      document.querySelector("#reviewClose").onclick = () =>
        (review.hidden = true);
      calendar.addEventListener("click", (event) => {
        let button = event.target.closest(".day:not(.empty)");
        if (!button) return;
        let selected = new Date(
            shown.getFullYear(),
            shown.getMonth(),
            Number(button.textContent),
          ),
          selectedKey = id(selected),
          completed = state.checks[selectedKey] || [];
        document.querySelector("#reviewTitle").textContent =
          selected.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          });
        document.querySelector("#reviewSummary").textContent =
          `${completed.length} of ${state.habits.length} habits completed`;
        let list = document.querySelector("#reviewHabits");
        list.innerHTML = "";
        state.habits.forEach((habit, index) => {
          let item = document.createElement("div");
          item.className =
            "chip " + (completed.includes(index) ? "review-done" : "");
          item.textContent =
            (completed.includes(index) ? "✓ " : "○ ") + habit.name;
          list.append(item);
        });
        document.querySelector("#reviewRemark").textContent =
          state.remarks[selectedKey] || "No remark was saved for this day.";
        review.hidden = false;
      });
      const quotes = [
        "Consistency is quiet power, repeated.",
        "Begin before you feel ready; momentum will meet you there.",
        "A small promise kept today becomes self-trust tomorrow.",
        "Progress does not need to be loud to be real.",
        "Your future is shaped by the ordinary choices you honour.",
        "One focused step is stronger than a perfect plan left undone.",
        "Show up gently. The strength comes from returning.",
      ];
      const quoteCard = document.createElement("article");
      quoteCard.className = "card";
      quoteCard.style.gridColumn = "1/-1";
      quoteCard.innerHTML =
        '<h2>Today’s momentum</h2><p class="quote-text"></p>';
      quoteCard.querySelector(".quote-text").textContent =
        quotes[Math.floor(today.getTime() / 86400000) % quotes.length];
      document.querySelector(".layout").prepend(quoteCard);
      document.head.append(
        Object.assign(document.createElement("style"), {
          textContent:
            '.quote-text{font:italic 25px/1.25 "Book Antiqua","Palatino Linotype",serif;margin-top:9px;max-width:760px;color:var(--moss)}',
        }),
      );
      document.title = "Rhythm — daily check-in";
      document.querySelector(".brand").textContent = "rhythm";
      const authStyle = document.createElement("style");
      authStyle.textContent =
        '.auth-screen{position:fixed;inset:0;background:var(--paper);z-index:20;display:grid;place-items:center;padding:20px}.auth-box{width:min(100%,420px);background:var(--card);border:1px solid var(--line);border-radius:22px;padding:28px}.auth-box h1{font-size:30px}.auth-box input{width:100%;padding:11px;margin-top:12px;border:1px solid var(--line);border-radius:10px}.auth-box button{width:100%;margin-top:15px;border:0;border-radius:10px;padding:11px;background:var(--moss);color:white;font-weight:700}.auth-error{color:#a83b32;font:13px "Trebuchet MS",sans-serif;margin-top:10px}.logout{border:0;background:none;color:var(--moss);font:12px "Trebuchet MS",sans-serif;text-decoration:underline;padding:0;margin-top:5px}';
      document.head.append(authStyle);
      const auth = document.createElement("section");
      auth.className = "auth-screen";
      document.body.append(auth);
      async function passHash(value) {
        let bytes = new TextEncoder().encode(value),
          digest = await crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(digest), (b) =>
          b.toString(16).padStart(2, "0"),
        ).join("");
      }
      function authScreen(message = "") {
        let account = JSON.parse(
            localStorage.getItem("rhythm-account") || "null",
          ),
          isNew = !account;
        auth.innerHTML = `<div class="auth-box"><h1>${isNew ? "Create your login" : "Welcome back"}</h1><p class="sub">${isNew ? "Choose credentials for this device." : "Sign in to continue your rhythm."}</p><input id="authUser" autocomplete="username" placeholder="Username" ${isNew ? "" : 'value="' + account.username + '"'}><input id="authPass" type="password" autocomplete="current-password" placeholder="Password"><input id="authConfirm" type="password" placeholder="Confirm password" ${isNew ? "" : "hidden"}><button id="authSubmit">${isNew ? "Create account" : "Sign in"}</button><p class="auth-error">${message}</p></div>`;
        document.querySelector("#authSubmit").onclick = async () => {
          let user = document.querySelector("#authUser").value.trim(),
            password = document.querySelector("#authPass").value,
            confirm = document.querySelector("#authConfirm").value;
          if (!user || password.length < 4)
            return authScreen(
              "Use a username and a password of at least 4 characters.",
            );
          if (isNew && password !== confirm)
            return authScreen("Passwords do not match.");
          let hash = await passHash(user + "|" + password);
          if (isNew) {
            localStorage.setItem(
              "rhythm-account",
              JSON.stringify({ username: user, hash }),
            );
            auth.remove();
          } else if (user === account.username && hash === account.hash) {
            auth.remove();
          } else authScreen("Username or password is incorrect.");
        };
      }
      authScreen();
      const logout = document.createElement("button");
      logout.className = "logout";
      logout.textContent = "Log out";
      document.querySelector(".top").append(logout);
      logout.onclick = () => {
        document.body.append(auth);
        authScreen();
      };
