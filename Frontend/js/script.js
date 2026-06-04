/**
 * CropClimate AI - Core Client Application Script
 * Handlers for authentication, climate data tracking, and dynamic recommendations.
 */

document.addEventListener("DOMContentLoaded", function () {
    
    // Global Constants / Base API Configuration URL
    const API_BASE_URL = "http://127.0.0.1:5000";

    /* =========================================================================
       1. REGISTER FORM HANDLER
       ========================================================================= */
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            // Select inputs safely using their specific ID attributes
            const nameInput = document.getElementById("name") || registerForm.querySelector("input[placeholder*='name']");
            const emailInput = document.getElementById("email") || registerForm.querySelector("input[type='email']");
            const passwordInput = document.getElementById("password") || registerForm.querySelector("input[type='password']");
            
            const errorBox = document.getElementById("errorMessage");
            const successBox = document.getElementById("successMessage");
            const submitBtn = registerForm.querySelector("button[type='submit']") || registerForm.querySelector("button");

            // Cache data values
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            // Reset UI feedback states
            if (errorBox) errorBox.classList.add("d-none");
            if (successBox) successBox.classList.add("d-none");
            
            // Set dynamic loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing Registration...';
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
                    errorBox.innerText = error.message;
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
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Verifying...';
            }

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.user_id) {
                    // Cache the user context safely for saving structural climate data later
                    localStorage.setItem("user_id", data.user_id);
                    window.location.href = "dashboard.html";
                } else {
                    throw new Error(data.message || "Invalid credentials provided.");
                }
            } catch (error) {
                if (errorBox) {
                    errorBox.innerText = error.message;
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

            // Explicit queries safely bound to type metrics or clear labels
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

            // Build payload for recommendations calculation engine
            const climateData = { temperature, humidity, rainfall, soil };
            localStorage.setItem("climateData", JSON.stringify(climateData));

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Calculating Best Yield Metrics...';
            }

            try {
                // Submit record asynchronously to MongoDB via Flask Endpoint
                const response = await fetch(`${API_BASE_URL}/climate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        temperature: temperature,
                        humidity: humidity,
                        rainfall: rainfall,
                        soil: soil,
                        user_id: userId || "anonymous" // Fallback safety layer
                    })
                });

                if (!response.ok) {
                    console.warn("Backend was unable to persist data record, continuing localized generation.");
                }
                
                // Proceed smoothly directly to view recommendations report page
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

            // Algorithmic rules for evaluation
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

            // Target updated modern UI elements dynamically
            const cropTitleEl = document.getElementById("cropName");
            const cropIconEl = document.querySelector(".crop-icon-bg");
            const descEl = document.querySelector(".lead");
            const scoreDisplayEl = document.querySelector(".stat-card .text-success");
            const progressBarEl = document.querySelector(".progress-bar");
            
            // Handle secondary indicators systematically
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

            // Map updated status tags into custom metrics layout
            if (statCards.length >= 3) {
                // Update Risk element card 
                const riskHeading = statCards[1].querySelector("h3");
                if (riskHeading) {
                    riskHeading.innerText = risk;
                    riskHeading.className = `mb-0 fw-bold ${riskClass}`;
                }
                // Update Environment Match text element card
                const matchHeading = statCards[2].querySelector("h3");
                if (matchHeading) matchHeading.innerText = matchText;
            }
        }
    }
});