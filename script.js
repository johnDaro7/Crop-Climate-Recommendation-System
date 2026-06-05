/**
 * CropClimate AI - Core Client Application Script
 * Handlers for authentication, climate data tracking, and dynamic recommendations.
 * Enhanced with Render Free Tier spin-up UX alerts.
 */

document.addEventListener("DOMContentLoaded", function () {
    
    // ⚠️ CRITICAL: Replace this URL with your actual live Render Web Service URL!
    // Example: "https://crop-climate-backend.onrender.com"
    const API_BASE_URL = "https://crop-climate-recommendation-system.onrender.com";

    /* =========================================================================
       1. REGISTER FORM HANDLER
       ========================================================================= */
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const nameInput = document.getElementById("name") || registerForm.querySelector("input[placeholder*='name']");
            const emailInput = document.getElementById("email") || registerForm.querySelector("input[type='email']");
            const passwordInput = document.getElementById("password") || registerForm.querySelector("input[type='password']");
            
            const errorBox = document.getElementById("errorMessage");
            const successBox = document.getElementById("successMessage");
            const submitBtn = registerForm.querySelector("button[type='submit']") || registerForm.querySelector("button");

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (errorBox) errorBox.classList.add("d-none");
            if (successBox) successBox.classList.add("d-none");
            
            // 🔄 UPDATED: Added a friendly cold-start warning to the loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Waking up cloud server... (May take ~60s if idle) ⏳';
            }

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    if (successBox) {
                        successBox.innerText = data.message || "Account registered successfully! Redirecting...";
                        successBox.classList.remove("d-none");
                    } else {
                        alert(data.message || "Registration Successful!");
                    }
                    registerForm.reset();
                    setTimeout(() => { window.location.href = "login.html"; }, 2000);
                } else {
                    throw new Error(data.message || "Registration encountered an error.");
                }
            } catch (error) {
                if (errorBox) {
                    // 🔄 UPDATED: Catches connection errors caused by server-sleep delays
                    if (error.name === "TypeError" || error.message.includes("fetch")) {
                        errorBox.innerText = "Cannot connect to server right now. The free cloud hosting server is spinning up. Please wait 1 minute and click register again!";
                    } else {
                        errorBox.innerText = error.message;
                    }
                    errorBox.classList.remove("d-none");
                } else {
                    alert(error.message);
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-person-plus me-2"></i> Register Account';
                }
            }
        });
    }

    /* =========================================================================
       2. LOGIN FORM HANDLER
       ========================================================================= */
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const emailInput = document.getElementById("email") || loginForm.querySelector("input[type='email']");
            const passwordInput = document.getElementById("password") || loginForm.querySelector("input[type='password']");
            
            const errorBox = document.getElementById("errorMessage");
            const submitBtn = loginForm.querySelector("button[type='submit']") || loginForm.querySelector("button");

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (errorBox) errorBox.classList.add("d-none");
            
            // 🔄 UPDATED: Added a friendly cold-start warning to the loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Waking up cloud server... (May take ~60s if idle) ⏳';
            }

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.user_id) {
                    localStorage.setItem("user_id", data.user_id);
                    window.location.href = "dashboard.html";
                } else {
                    throw new Error(data.message || "Invalid credentials provided.");
                }
            } catch (error) {
                if (errorBox) {
                    // 🔄 UPDATED: Gracefully tells user the server is sleeping instead of showing an outright failure
                    if (error.name === "TypeError" || error.message.includes("fetch")) {
                        errorBox.innerText = "Cannot connect to server. The free cloud server is still waking up. Please give it a few seconds and try logging in again!";
                    } else {
                        errorBox.innerText = error.message;
                    }
                    errorBox.classList.remove("d-none");
                } else {
                    alert(error.message);
                }
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i> Log In';
                }
            }
        });
    }

    /* =========================================================================
       3. CLIMATE INPUT FORM HANDLER
       ========================================================================= */
    const climateForm = document.getElementById("climateForm");
    if (climateForm) {
        climateForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const temperatureInput = climateForm.querySelector("input[placeholder*='30']") || climateForm.querySelectorAll("input[type='number']")[0];
            const humidityInput = climateForm.querySelector("input[placeholder*='75']") || climateForm.querySelectorAll("input[type='number']")[1];
            const rainfallInput = climateForm.querySelector("input[placeholder*='150']") || climateForm.querySelectorAll("input[type='number']")[2];
            const soilSelect = climateForm.querySelector("select");
            const submitBtn = climateForm.querySelector("button[type='submit']");

            const temperature = temperatureInput.value;
            const humidity = humidityInput.value;
            const rainfall = rainfallInput.value;
            const soil = soilSelect.value;
            const userId = localStorage.getItem("user_id");

            const climateData = { temperature, humidity, rainfall, soil };
            localStorage.setItem("climateData", JSON.stringify(climateData));

            // 🔄 UPDATED: Informative text for database operations
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving data to cloud database...';
            }

            try {
                const response = await fetch(`${API_BASE_URL}/climate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        temperature: temperature,
                        humidity: humidity,
                        rainfall: rainfall,
                        soil: soil,
                        user_id: userId || "anonymous"
                    })
                });

                if (!response.ok) {
                    console.warn("Backend was unable to persist data record, continuing localized generation.");
                }
                
                window.location.href = "recommendation.html";

            } catch (error) {
                console.error("Network offline or connection dropped. Loading algorithmic fallback output:", error);
                window.location.href = "recommendation.html";
            }
        });
    }

    /* =========================================================================
       4. ANALYTICS RECOMMENDATION ENGINE INJECTOR
       ========================================================================= */
    if (window.location.pathname.includes("recommendation.html") || document.getElementById("cropName")) {
        const storedContext = localStorage.getItem("climateData");

        if (storedContext) {
            const data = JSON.parse(storedContext);
            
            let crop = "Millet";
            let reason = "Low rainfall conditions are suitable for millet.";
            let score = 78;
            let risk = "Low";
            let riskClass = "text-success";
            let matchText = "Good";
            let cropIcon = "bi-flower3";

            const temp = parseFloat(data.temperature) || 0;
            const rain = parseFloat(data.rainfall) || 0;
            const hum = parseFloat(data.humidity) || 0;

            if (rain > 150 && hum > 70) {
                crop = "Rice";
                score = 92;
                risk = "Medium";
                riskClass = "text-warning";
                matchText = "Excellent";
                cropIcon = "bi-flower1";
                reason = `Based on your recent climate data showing ideal precipitation (${rain}mm) and moisture metrics (${hum}%), Rice is the most profitable and biologically suitable crop for your environment.`;
            } else if (rain > 100 && temp >= 25) {
                crop = "Maize";
                score = 85;
                risk = "Low";
                riskClass = "text-success";
                matchText = "Optimal";
                cropIcon = "bi-patch-check";
                reason = `Moderate rainfall and sustainable warm conditions (${temp}°C) safely support robust Maize development cycles across your land layout.`;
            }

            const cropTitleEl = document.getElementById("cropName");
            const cropIconEl = document.querySelector(".crop-icon-bg");
            const descEl = document.querySelector(".lead");
            const scoreDisplayEl = document.querySelector(".stat-card .text-success");
            const progressBarEl = document.querySelector(".progress-bar");
            
            const statCards = document.querySelectorAll(".stat-card");

            if (cropTitleEl) cropTitleEl.innerText = crop;
            if (descEl) descEl.innerText = reason;
            
            if (cropIconEl && cropIcon) {
                cropIconEl.className = `bi ${cropIcon} crop-icon-bg`;
            }

            if (scoreDisplayEl) scoreDisplayEl.innerText = `${score}%`;
            if (progressBarEl) {
                progressBarEl.style.width = `${score}%`;
                progressBarEl.setAttribute("aria-valuenow", score);
            }

            if (statCards.length >= 3) {
                const riskHeading = statCards[1].querySelector("h3");
                if (riskHeading) {
                    riskHeading.innerText = risk;
                    riskHeading.className = `mb-0 fw-bold ${riskClass}`;
                }
                const matchHeading = statCards[2].querySelector("h3");
                if (matchHeading) matchHeading.innerText = matchText;
            }
        }
    }
});