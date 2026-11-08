// =====================================================
// COIVI.TN - SUPABASE FUNCTIONS
// Authentication, rides and reservations
// =====================================================


// =====================================================
// SIGN UP
// =====================================================

const signupForm = document.getElementById("signup-form");

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document
            .getElementById("signup-name")
            .value
            .trim();

        const email = document
            .getElementById("signup-email")
            .value
            .trim();

        const password = document
            .getElementById("signup-password")
            .value;

        const message =
            document.getElementById("signup-message");

        // Minimum 8 characters
        if (password.length < 8) {
            message.textContent =
                "Le mot de passe doit contenir au moins 8 caractères.";
            return;
        }

        message.textContent = "Création du compte...";

        const { data, error } = await sb.auth.signUp({
            email: email,
            password: password,

            options: {
                data: {
                    full_name: name
                },

                emailRedirectTo:
                    "https://coivi-tn.vercel.app/verification.html"
            }
        });

        if (error) {
            console.error(error);

            message.textContent =
                "Erreur : " + error.message;

            return;
        }

        message.textContent =
            "Compte créé ! Vérifiez votre e-mail pour confirmer votre compte.";

        signupForm.reset();
    });
}
// =====================================================
// LOGIN
// =====================================================

const loginForm = document.getElementById("login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const message = document.getElementById("login-message");

        message.textContent = "Connexion en cours...";

        const { data, error } = await sb.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error(error);
            message.textContent = "Erreur : e-mail ou mot de passe incorrect.";
            return;
        }

        message.textContent = "Connexion réussie !";

        // Send the connected user to their account page
        window.location.href = "compte.html";
    });
}// =====================================================
// ACCOUNT PAGE
// =====================================================

const accountContent = document.getElementById("account-content");
const accountLoading = document.getElementById("account-loading");
const accountName = document.getElementById("account-name");
const accountEmail = document.getElementById("account-email");
const accountMessage = document.getElementById("account-message");
const logoutButton = document.getElementById("logout-button");

async function loadAccount() {

    // Only run this code on compte.html
    if (!accountContent) {
        return;
    }

    const { data, error } = await sb.auth.getUser();

    // If there is no logged-in user, return to login page
    if (error || !data.user) {
        window.location.href = "login.html";
        return;
    }

    const user = data.user;

    // Display user information
    accountName.textContent =
        user.user_metadata?.full_name || "Utilisateur Coivi";

    accountEmail.textContent = user.email;

    accountLoading.style.display = "none";
    accountContent.style.display = "block";
}



/* =====================================================
   LOGOUT
===================================================== */

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        accountMessage.textContent = "Déconnexion...";

        const { error } = await sb.auth.signOut();

        if (error) {
            console.error("Erreur de déconnexion :", error);
            accountMessage.textContent =
                "Erreur lors de la déconnexion.";
            return;
        }

        // Remove the saved panier
        localStorage.removeItem("coiviPanier");

        // Return to the home page
        window.location.replace("index.html");
    });
}



// Load the account when compte.html opens
loadAccount();// =====================================================
// PUBLISH A RIDE
// =====================================================

const rideForm = document.getElementById("ride-form");

if (rideForm) {
    rideForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const message = document.getElementById("ride-message");

        // Check that the user is logged in
        const { data: userData, error: userError } =
            await sb.auth.getUser();

        if (userError || !userData.user) {
            message.textContent =
                "Vous devez être connecté pour publier un trajet.";

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

            return;
        }

        const departure =
            document.getElementById("ride-departure").value.trim();

        const destination =
            document.getElementById("ride-destination").value.trim();

        const departureTime =
            document.getElementById("ride-date").value;

        const seats =
            Number(document.getElementById("ride-seats").value);

        const price =
            Number(document.getElementById("ride-price").value);

        const description =
            document.getElementById("ride-description").value.trim();

        const driverName =
            userData.user.user_metadata?.full_name || "Conducteur Coivi";

        message.textContent = "Publication du trajet...";

        const { data, error } = await sb
            .from("rides")
            .insert({
                departure: departure,
                destination: destination,
                departure_time: departureTime,
                available_seats: seats,
                price_per_passenger: price,
                description: description,
                driver_name: driverName,
                is_available: true
            })
            .select()
            .single();

        if (error) {
            console.error(error);

            if (error.code === "42501") {
                message.textContent =
                    "Vous n'avez pas l'autorisation de publier ce trajet.";
            } else {
                message.textContent =
                    "Erreur lors de la publication du trajet.";
            }

            return;
        }

        message.textContent =
            "✓ Trajet publié avec succès !";

        rideForm.reset();
    });
}// =====================================================
// =====================================================
// DISPLAY AVAILABLE RIDES - NEW DESIGN
// =====================================================

const ridesList = document.getElementById("rides-list");
const ridesLoading = document.getElementById("rides-loading");

async function loadAvailableRides() {

    if (!ridesList) {
        return;
    }

    const { data: rides, error } = await sb
        .from("rides")
        .select("*")
        .eq("is_available", true)
        .gt("available_seats", 0)
        .order("departure_time", { ascending: true });

    if (error) {
        console.error(error);

        if (ridesLoading) {
            ridesLoading.textContent =
                "Impossible de charger les trajets.";
        }

        return;
    }

    if (ridesLoading) {
        ridesLoading.style.display = "none";
    }

    // No available rides
    if (!rides || rides.length === 0) {

        ridesList.innerHTML = `
            <div class="no-rides-card">
                <div class="no-rides-icon">🚗</div>
                <h3>Aucun trajet disponible</h3>
                <p>Aucun trajet disponible pour le moment.</p>
            </div>
        `;

        return;
    }

    ridesList.innerHTML = "";

    rides.forEach((ride) => {

        const departureDate = new Date(ride.departure_time);

        const formattedDate =
            departureDate.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

        const formattedTime =
            departureDate.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit"
            });

        const price = Number(ride.price_per_passenger);

        const driverName =
            ride.driver_name || "Conducteur Coivi";

        const rideCard = document.createElement("article");

        rideCard.className = "ride-card premium-ride-card";

        rideCard.innerHTML = `

            <div class="ride-card-header">

                <div class="ride-route-area">

                    <div class="route-icon">
                        🚗
                    </div>

                    <div>

                        <span class="route-label">
                            VOTRE TRAJET
                        </span>

                        <div class="ride-route">

                            <div class="route-city">
                                <span class="route-dot departure-dot"></span>
                                <strong>${ride.departure}</strong>
                            </div>

                            <div class="route-line">
                                <span></span>
                                <b>→</b>
                                <span></span>
                            </div>

                            <div class="route-city">
                                <span class="route-dot destination-dot"></span>
                                <strong>${ride.destination}</strong>
                            </div>

                        </div>

                    </div>

                </div>


                <div class="ride-price-box">

                    <span class="price-label">
                        PRIX
                    </span>

                    <div class="ride-price">
                        ${price.toFixed(2)}
                        <span>DT</span>
                    </div>

                    <small>par personne</small>

                </div>

            </div>


            <div class="ride-availability-row">

                <span class="ride-available-badge">
                    <span class="availability-dot"></span>
                    Trajet disponible
                </span>

                <span class="ride-seats-badge">
                    💺 ${ride.available_seats}
                    place${ride.available_seats > 1 ? "s" : ""}
                    disponible${ride.available_seats > 1 ? "s" : ""}
                </span>

            </div>


            <div class="ride-info-grid">

                <div class="ride-info-item">

                    <div class="ride-info-icon">
                        📅
                    </div>

                    <div>
                        <span>Date</span>
                        <strong>${formattedDate}</strong>
                    </div>

                </div>


                <div class="ride-info-item">

                    <div class="ride-info-icon">
                        🕐
                    </div>

                    <div>
                        <span>Heure</span>
                        <strong>${formattedTime}</strong>
                    </div>

                </div>


                <div class="ride-info-item">

                    <div class="ride-info-icon">
                        👤
                    </div>

                    <div>
                        <span>Conducteur</span>
                        <strong>${driverName}</strong>
                    </div>

                </div>


                <div class="ride-info-item">

                    <div class="ride-info-icon">
                        💺
                    </div>

                    <div>
                        <span>Places restantes</span>
                        <strong>
                            ${ride.available_seats}
                            place${ride.available_seats > 1 ? "s" : ""}
                        </strong>
                    </div>

                </div>

            </div>


            ${
                ride.description
                    ? `
                        <div class="ride-description">

                            <span>💬</span>

                            <div>
                                <strong>
                                    Information du conducteur
                                </strong>

                                <p>${ride.description}</p>
                            </div>

                        </div>
                    `
                    : ""
            }


            <div class="ride-booking-panel">

                <div class="booking-panel-title">

                    <div>

                        <span class="booking-small-title">
                            VOTRE RÉSERVATION
                        </span>

                        <h4>
                            Réservez votre place
                        </h4>

                    </div>

                    <span class="secure-booking">
                        ✓ Réservation rapide
                    </span>

                </div>


                <div class="booking-fields">

                    <div class="booking-field">

                        <label for="reservation-seats-${ride.id}">
                            Nombre de passagers
                        </label>

                        <div class="booking-input-wrapper">

                            <span>👥</span>

                            <input
                                type="number"
                                id="reservation-seats-${ride.id}"
                                class="reservation-seats-input"
                                min="1"
                                max="${ride.available_seats}"
                                value="1"
                                data-price="${price}"
                                data-total-id="reservation-total-${ride.id}"
                            >

                        </div>

                    </div>


                    <div class="booking-field">

                        <label for="payment-${ride.id}">
                            Mode de paiement
                        </label>

                        <div class="booking-input-wrapper">

                            <span>💳</span>

                            <select
                                id="payment-${ride.id}"
                                class="payment-method">

                                <option value="card">
                                    Carte bancaire — Simulation
                                </option>

                                <option value="cash">
                                    Paiement en espèces
                                </option>

                            </select>

                        </div>

                    </div>


                    <div class="booking-total">

                        <span>Total</span>

                        <strong id="reservation-total-${ride.id}">
                            ${price.toFixed(2)} DT
                        </strong>

                    </div>

                </div>


                <div class="booking-bottom">

                    <div class="payment-demo-info">

                        <span class="payment-demo-icon">
                            🔒
                        </span>

                        <div>

                            <strong>
                                Paiement de démonstration
                            </strong>

                            <small>
                                Aucun paiement réel ne sera effectué.
                            </small>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="btn reserve-button premium-reserve-button"
                        data-ride-id="${ride.id}"
                        data-price="${price}"
                    >
                        Réserver ce trajet
                        <span>→</span>
                    </button>

                </div>


                <p
                    class="reservation-message"
                    id="reservation-message-${ride.id}">
                </p>

            </div>

        `;

        ridesList.appendChild(rideCard);
    });


    // LIVE TOTAL CALCULATION

    const seatInputs =
        ridesList.querySelectorAll(".reservation-seats-input");

    seatInputs.forEach((input) => {

        input.addEventListener("input", function () {

            let seats = Number(this.value);

            const maxSeats = Number(this.max);
            const price = Number(this.dataset.price);

            if (!seats || seats < 1) {
                seats = 1;
            }

            if (seats > maxSeats) {
                seats = maxSeats;
                this.value = maxSeats;
            }

            const total = seats * price;

            const totalElement =
                document.getElementById(this.dataset.totalId);

            if (totalElement) {
                totalElement.textContent =
                    total.toFixed(2) + " DT";
            }

        });

    });

}


// Load rides when the page opens
loadAvailableRides();
// =====================================================
// SERVICE 1 - ADD SELECTED RIDE TO PANIER
// =====================================================

if (ridesList) {

    ridesList.addEventListener("click", async (event) => {

        const button = event.target.closest(".reserve-button");

        if (!button) {
            return;
        }

        const rideId = Number(button.dataset.rideId);
        const price = Number(button.dataset.price);

        const seatsInput = document.getElementById(
            `reservation-seats-${rideId}`
        );

        const paymentSelect = document.getElementById(
            `payment-${rideId}`
        );

        const message = document.getElementById(
            `reservation-message-${rideId}`
        );

        const seats = Number(seatsInput.value);

        // Check number of seats
        if (!Number.isInteger(seats) || seats < 1) {
            message.textContent =
                "Veuillez choisir un nombre de places valide.";
            return;
        }

        // Check if user is connected
        const { data: userData, error: userError } =
            await sb.auth.getUser();

        if (userError || !userData.user) {

            message.textContent =
                "Vous devez être connecté pour réserver.";

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);

            return;
        }

        // Get the selected ride from Supabase
        const { data: ride, error: rideError } =
            await sb
                .from("rides")
                .select("*")
                .eq("id", rideId)
                .single();

        if (rideError || !ride) {

            console.error(rideError);

            message.textContent =
                "Impossible de sélectionner ce trajet.";

            return;
        }

        // Make sure enough seats are still available
        if (seats > ride.available_seats) {

            message.textContent =
                "Il n'y a pas assez de places disponibles.";

            return;
        }

        const total = price * seats;

        // Information that panier.html will use
        const panierItem = {

            rideId: ride.id,

            departure: ride.departure,

            destination: ride.destination,

            departureTime: ride.departure_time,

            driverName:
                ride.driver_name || "Conducteur Coivi",

            seats: seats,

            availableSeats: ride.available_seats,

            pricePerPassenger: price,

            total: total,

            paymentMethod:
                paymentSelect
                    ? paymentSelect.value
                    : "card"
        };

        // Save temporarily in the browser
        localStorage.setItem(
            "coiviPanier",
            JSON.stringify(panierItem)
        );

        message.textContent =
            "✓ Trajet ajouté au panier.";

        // Open panier page
        setTimeout(() => {
            window.location.href = "panier.html";
        }, 500);

    });

}
// =====================================================
// MY RESERVATIONS
// =====================================================

const reservationsList = document.getElementById("reservations-list");
const reservationsLoading = document.getElementById("reservations-loading");

async function loadMyReservations() {

    // Only run on a page containing the reservations section
    if (!reservationsList) {
        return;
    }

    // Get connected user
    const { data: userData, error: userError } =
        await sb.auth.getUser();

    if (userError || !userData.user) {
        return;
    }

    const user = userData.user;

    // Get this user's reservations + ride information
    const { data: reservations, error } = await sb
        .from("reservations")
        .select(`
            id,
            seats_reserved,
            total_price,
            status,
            created_at,
            rides (
                departure,
                destination,
                departure_time,
                driver_name
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);

        if (reservationsLoading) {
            reservationsLoading.textContent =
                "Impossible de charger vos réservations.";
        }

        return;
    }

    if (reservationsLoading) {
        reservationsLoading.style.display = "none";
    }

    if (!reservations || reservations.length === 0) {
        reservationsList.innerHTML =
            "<p>Vous n'avez aucune réservation pour le moment.</p>";
        return;
    }

    reservationsList.innerHTML = "";

    reservations.forEach((reservation) => {

        const ride = reservation.rides;

        const rideDate = ride?.departure_time
            ? new Date(ride.departure_time).toLocaleString("fr-FR")
            : "Date non disponible";

        const card = document.createElement("div");
        card.className = "reservation-card";

        card.innerHTML = `
            <h3>
                ${ride?.departure || ""}
                →
                ${ride?.destination || ""}
            </h3>

            <p>
                <strong>Date :</strong>
                ${rideDate}
            </p>

            <p>
                <strong>Conducteur :</strong>
                ${ride?.driver_name || "Conducteur Coivi"}
            </p>

            <p>
                <strong>Places réservées :</strong>
                ${reservation.seats_reserved}
            </p>

            <p>
                <strong>Total :</strong>
                ${Number(reservation.total_price).toFixed(2)} DT
            </p>

            <p>
                <strong>Statut :</strong>
                ${reservation.status}
            </p>
        `;

        reservationsList.appendChild(card);
    });
}


// Load reservation history
loadMyReservations();// =====================================================
// ADMIN PAGE - ACCESS CONTROL
// =====================================================

const adminContent = document.getElementById("admin-content");
const adminLoading = document.getElementById("admin-loading");
const adminMessage = document.getElementById("admin-message");
const adminLogoutButton = document.getElementById("admin-logout-button");

async function loadAdminPage() {

    // Only run on admin.html
    if (!adminContent) {
        return;
    }

    // Check if a user is logged in
    const { data: userData, error: userError } =
        await sb.auth.getUser();

    if (userError || !userData.user) {
        window.location.href = "login.html";
        return;
    }

    // Check the user's role
    const { data: roleData, error: roleError } = await sb
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .maybeSingle();

    if (roleError) {
        console.error(roleError);
        adminLoading.textContent =
            "Erreur lors de la vérification des droits.";
        return;
    }

    // Block normal users
    if (!roleData || roleData.role !== "admin") {
        adminLoading.textContent =
            "Accès refusé : cette page est réservée aux administrateurs.";

        return;
    }

    // Admin confirmed
    adminLoading.style.display = "none";
    adminContent.style.display = "block";
}


// =====================================================
// ADMIN LOGOUT
// =====================================================

if (adminLogoutButton) {

    adminLogoutButton.addEventListener("click", async () => {

        const { error } = await sb.auth.signOut();

        if (error) {
            console.error(error);
            adminMessage.textContent =
                "Erreur lors de la déconnexion.";
            return;
        }

        window.location.href = "login.html";
    });
}


// Check admin access when admin.html opens
loadAdminPage();// =====================================================
// ADMIN - LOAD RIDES AND RESERVATIONS
// =====================================================

const adminRides = document.getElementById("admin-rides");
const adminReservations = document.getElementById("admin-reservations");

async function loadAdminData() {

    // Only run on admin.html
    if (!adminRides || !adminReservations) {
        return;
    }

    // Check current user
    const { data: userData, error: userError } =
        await sb.auth.getUser();

    if (userError || !userData.user) {
        return;
    }

    // Verify admin role again
    const { data: roleData, error: roleError } = await sb
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .maybeSingle();

    if (roleError || !roleData || roleData.role !== "admin") {
        return;
    }

    // =================================================
    // LOAD RIDES
    // =================================================

    const { data: rides, error: ridesError } = await sb
        .from("rides")
        .select("*")
        .order("departure_time", { ascending: true });

    if (ridesError) {

        console.error(ridesError);

        adminRides.innerHTML =
            "<p>Impossible de charger les trajets.</p>";

    } else if (!rides || rides.length === 0) {

        adminRides.innerHTML =
            "<p>Aucun trajet enregistré.</p>";

    } else {

        adminRides.innerHTML = "";

        rides.forEach((ride) => {

            const card = document.createElement("div");
            card.className = "ride-card";

            const date =
                new Date(ride.departure_time)
                    .toLocaleString("fr-FR");

            card.innerHTML = `
                <h3>
                    ${ride.departure} → ${ride.destination}
                </h3>

                <p>
                    <strong>Date :</strong>
                    ${date}
                </p>

                <p>
                    <strong>Conducteur :</strong>
                    ${ride.driver_name || "Conducteur Coivi"}
                </p>

                <p>
                    <strong>Places disponibles :</strong>
                    ${ride.available_seats}
                </p>

                <p>
                    <strong>Prix :</strong>
                    ${Number(ride.price_per_passenger).toFixed(2)} DT
                </p>

                <p>
                    <strong>Disponible :</strong>
                    ${ride.is_available ? "Oui" : "Non"}
                </p>
            `;

            adminRides.appendChild(card);
        });
    }


    // =================================================
    // LOAD RESERVATIONS
    // =================================================

    const { data: reservations, error: reservationsError } =
        await sb
            .from("reservations")
            .select(`
                id,
                seats_reserved,
                total_price,
                status,
                created_at,
                rides (
                    departure,
                    destination
                )
            `)
            .order("created_at", { ascending: false });

    if (reservationsError) {

        console.error(reservationsError);

        adminReservations.innerHTML =
            "<p>Impossible de charger les réservations.</p>";

    } else if (!reservations || reservations.length === 0) {

        adminReservations.innerHTML =
            "<p>Aucune réservation enregistrée.</p>";

    } else {

        adminReservations.innerHTML = "";

        reservations.forEach((reservation) => {

            const card = document.createElement("div");
            card.className = "reservation-card";

            card.innerHTML = `
                <h3>
                    ${reservation.rides?.departure || ""}
                    →
                    ${reservation.rides?.destination || ""}
                </h3>

                <p>
                    <strong>Places réservées :</strong>
                    ${reservation.seats_reserved}
                </p>

                <p>
                    <strong>Total :</strong>
                    ${Number(reservation.total_price).toFixed(2)} DT
                </p>

                <label>
                    <strong>Statut :</strong>
                </label>

                <select
                    class="admin-status"
                    data-reservation-id="${reservation.id}"
                >
                    <option value="pending"
                        ${reservation.status === "pending" ? "selected" : ""}>
                        En attente
                    </option>

                    <option value="confirmed"
                        ${reservation.status === "confirmed" ? "selected" : ""}>
                        Confirmée
                    </option>

                    <option value="cancelled"
                        ${reservation.status === "cancelled" ? "selected" : ""}>
                        Annulée
                    </option>
                </select>
            `;

            adminReservations.appendChild(card);
        });
    }
}


// =====================================================
// ADMIN - CHANGE RESERVATION STATUS
// =====================================================

if (adminReservations) {

    adminReservations.addEventListener("change", async (event) => {

        if (!event.target.classList.contains("admin-status")) {
            return;
        }

        const reservationId =
            Number(event.target.dataset.reservationId);

        const newStatus = event.target.value;

        const { error } = await sb
            .from("reservations")
            .update({
                status: newStatus
            })
            .eq("id", reservationId);

        if (error) {

            console.error(error);

            if (adminMessage) {
                adminMessage.textContent =
                    "Erreur lors de la modification du statut.";
            }

            return;
        }

        if (adminMessage) {
            adminMessage.textContent =
                "✓ Statut de la réservation mis à jour.";
        }
    });
}


// Load admin information
loadAdminData();
// =====================================================
// SERVICE 2 - DAILY RIDES SEARCH
// =====================================================

const dailySearchForm = document.getElementById("daily-search-form");
const dailyRidesList = document.getElementById("daily-rides-list");

if (dailySearchForm && dailyRidesList) {

    dailySearchForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const departure =
            document.getElementById("daily-departure").value.trim();

        const destination =
            document.getElementById("daily-destination").value.trim();

        const time =
            document.getElementById("daily-time").value;

        const frequency =
            document.getElementById("daily-frequency").value;


        // Loading state

        dailyRidesList.innerHTML = `
            <div class="daily-loading">
                <span>🚗</span>
                <strong>Recherche des trajets...</strong>
            </div>
        `;


        // Get available rides from Supabase

        const { data: rides, error } = await sb
            .from("rides")
            .select("*")
            .eq("is_available", true)
            .gt("available_seats", 0)
            .order("departure_time", { ascending: true });


        if (error) {

            console.error(error);

            dailyRidesList.innerHTML = `
                <div class="daily-empty-state">
                    <div class="daily-empty-icon">⚠️</div>

                    <div>
                        <h3>Impossible de charger les trajets</h3>
                        <p>Veuillez réessayer dans quelques instants.</p>
                    </div>
                </div>
            `;

            return;
        }


        // Filter rides using departure / destination / time

        let filteredRides = rides || [];

        if (departure) {

            filteredRides = filteredRides.filter((ride) =>
                ride.departure
                    ?.toLowerCase()
                    .includes(departure.toLowerCase())
            );

        }


        if (destination) {

            filteredRides = filteredRides.filter((ride) =>
                ride.destination
                    ?.toLowerCase()
                    .includes(destination.toLowerCase())
            );

        }


        if (time) {

            filteredRides = filteredRides.filter((ride) => {

                const rideDate =
                    new Date(ride.departure_time);

                const rideHour =
                    rideDate.toTimeString().slice(0, 5);

                return rideHour === time;

            });

        }


        // The current database does not yet store a
        // recurring frequency, so this is displayed
        // as the requested passenger preference.

        const frequencyLabels = {
            weekdays: "Lundi – Vendredi",
            weekend: "Week-end",
            daily: "Tous les jours"
        };

        const frequencyText =
            frequencyLabels[frequency] || "Horaire régulier";


        // No results

        if (filteredRides.length === 0) {

            dailyRidesList.innerHTML = `
                <div class="daily-empty-state">

                    <div class="daily-empty-icon">
                        🔎
                    </div>

                    <div>

                        <h3>
                            Aucun trajet trouvé
                        </h3>

                        <p>
                            Essayez de modifier votre départ,
                            votre destination ou votre horaire.
                        </p>

                    </div>

                </div>
            `;

            return;
        }


        // Display results

        dailyRidesList.innerHTML = "";


        filteredRides.forEach((ride) => {

            const departureDate =
                new Date(ride.departure_time);

            const formattedDate =
                departureDate.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                });

            const formattedTime =
                departureDate.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit"
                });

            const price =
                Number(ride.price_per_passenger);

            const driverName =
                ride.driver_name || "Conducteur Coivi";


            const card =
                document.createElement("article");

            card.className =
                "daily-ride-card";


            card.innerHTML = `

                <div class="daily-card-top">

                    <div class="daily-route">

                        <span class="daily-icon">
                            ☀️
                        </span>

                        <div>

                            <span class="daily-card-label">
                                TRAJET QUOTIDIEN
                            </span>

                            <h3>
                                ${ride.departure}
                                <span>→</span>
                                ${ride.destination}
                            </h3>

                        </div>

                    </div>


                    <div class="daily-price">

                        <span>PRIX</span>

                        <strong>
                            ${price.toFixed(2)} DT
                        </strong>

                        <small>
                            par personne
                        </small>

                    </div>

                </div>


                <div class="daily-badges">

                    <span class="daily-frequency-badge">
                        🔁 ${frequencyText}
                    </span>

                    <span class="daily-available-badge">
                        ● Disponible
                    </span>

                </div>


                <div class="daily-info-grid">

                    <div class="daily-info">

                        <span class="daily-info-icon">
                            📅
                        </span>

                        <div>
                            <small>Date</small>
                            <strong>${formattedDate}</strong>
                        </div>

                    </div>


                    <div class="daily-info">

                        <span class="daily-info-icon">
                            🕐
                        </span>

                        <div>
                            <small>Horaire</small>
                            <strong>${formattedTime}</strong>
                        </div>

                    </div>


                    <div class="daily-info">

                        <span class="daily-info-icon">
                            👤
                        </span>

                        <div>
                            <small>Conducteur</small>
                            <strong>${driverName}</strong>
                        </div>

                    </div>


                    <div class="daily-info">

                        <span class="daily-info-icon">
                            💺
                        </span>

                        <div>
                            <small>Places</small>

                            <strong>
                                ${ride.available_seats}
                                disponible${ride.available_seats > 1 ? "s" : ""}
                            </strong>

                        </div>

                    </div>

                </div>


                <div class="daily-booking-panel">

                    <div class="daily-booking-title">

                        <div>
                            <span>VOTRE RÉSERVATION</span>
                            <h4>Réservez votre trajet quotidien</h4>
                        </div>

                        <span class="daily-fast-badge">
                            ✓ Réservation rapide
                        </span>

                    </div>


                    <div class="daily-booking-fields">

                        <div class="daily-booking-field">

                            <label>
                                Nombre de passagers
                            </label>

                            <input
                                type="number"
                                id="reservation-seats-${ride.id}"
                                class="daily-seats-input"
                                min="1"
                                max="${ride.available_seats}"
                                value="1"
                                data-price="${price}"
                                data-total-id="daily-total-${ride.id}"
                            >

                        </div>


                        <div class="daily-booking-field">

                            <label>
                                Mode de paiement
                            </label>

                            <select
                                id="payment-${ride.id}"
                                class="payment-method">

                                <option value="card">
                                    Carte bancaire — Simulation
                                </option>

                                <option value="cash">
                                    Paiement en espèces
                                </option>

                            </select>

                        </div>


                        <div class="daily-total">

                            <span>TOTAL</span>

                            <strong id="daily-total-${ride.id}">
                                ${price.toFixed(2)} DT
                            </strong>

                        </div>

                    </div>


                    <div class="daily-booking-bottom">

                        <div class="daily-payment-note">
                            🔒 Paiement de démonstration —
                            aucun paiement réel.
                        </div>


                        <button
                            type="button"
                            class="btn daily-reserve-button"
                            data-ride-id="${ride.id}"
                            data-price="${price}"
                        >
                            Réserver ce trajet →
                        </button>

                    </div>


                    <p
                        class="daily-reservation-message"
                        id="daily-reservation-message-${ride.id}">
                    </p>

                </div>

            `;


            dailyRidesList.appendChild(card);

        });


        // =============================================
        // LIVE TOTAL
        // =============================================

        const dailyInputs =
            dailyRidesList.querySelectorAll(".daily-seats-input");


        dailyInputs.forEach((input) => {

            input.addEventListener("input", function () {

                let seats =
                    Number(this.value);

                const maxSeats =
                    Number(this.max);

                const price =
                    Number(this.dataset.price);


                if (!seats || seats < 1) {
                    seats = 1;
                }


                if (seats > maxSeats) {

                    seats = maxSeats;

                    this.value =
                        maxSeats;

                }


                const total =
                    seats * price;


                const totalElement =
                    document.getElementById(
                        this.dataset.totalId
                    );


                if (totalElement) {

                    totalElement.textContent =
                        total.toFixed(2) + " DT";

                }

            });

        });

    });

}// =====================================================
// =====================================================
// SERVICE 2 - ADD DAILY RIDE TO PANIER
// =====================================================

if (dailyRidesList) {

    dailyRidesList.addEventListener("click", async (event) => {

        const button =
            event.target.closest(".daily-reserve-button");

        if (!button) {
            return;
        }

        const rideId =
            Number(button.dataset.rideId);

        const price =
            Number(button.dataset.price);

        const seatsInput =
            document.getElementById(
                `reservation-seats-${rideId}`
            );

        const paymentSelect =
            document.getElementById(
                `payment-${rideId}`
            );

        const message =
            document.getElementById(
                `daily-reservation-message-${rideId}`
            );

        const seats =
            Number(seatsInput.value);


        // Check number of seats
        if (!Number.isInteger(seats) || seats < 1) {

            message.textContent =
                "Veuillez choisir un nombre de places valide.";

            return;
        }


        // Check if user is connected
        const { data: userData, error: userError } =
            await sb.auth.getUser();

        if (userError || !userData.user) {

            message.textContent =
                "Vous devez être connecté pour réserver.";

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1200);

            return;
        }


        // Get selected ride from Supabase
        const { data: ride, error: rideError } =
            await sb
                .from("rides")
                .select("*")
                .eq("id", rideId)
                .single();

        if (rideError || !ride) {

            console.error(rideError);

            message.textContent =
                "Impossible de sélectionner ce trajet.";

            return;
        }


        // Check available seats
        if (seats > ride.available_seats) {

            message.textContent =
                "Il n'y a pas assez de places disponibles.";

            return;
        }


        const total = price * seats;


        // Information for panier.html
        const panierItem = {

            rideId: ride.id,

            departure: ride.departure,

            destination: ride.destination,

            departureTime: ride.departure_time,

            driverName:
                ride.driver_name || "Conducteur Coivi",

            seats: seats,

            availableSeats: ride.available_seats,

            pricePerPassenger: price,

            total: total,

            paymentMethod:
                paymentSelect
                    ? paymentSelect.value
                    : "card"
        };


        // Save selected ride in Panier
        localStorage.setItem(
            "coiviPanier",
            JSON.stringify(panierItem)
        );


        message.textContent =
            "✓ Trajet ajouté au panier.";


        // Open Panier
        setTimeout(() => {
            window.location.href = "panier.html";
        }, 500);

    });

}
// =====================================================
// HEADER - AUTHENTICATION NAVIGATION
// =====================================================

const authNav = document.getElementById("auth-nav");

async function updateAuthNavigation() {

    if (!authNav) {
        return;
    }

    // Check current session
    const {
        data: { session },
        error
    } = await sb.auth.getSession();


    // =============================================
    // USER NOT LOGGED IN
    // =============================================

    if (error || !session) {

        authNav.innerHTML = `
            <a href="login.html">
                Connexion
            </a>

            <a href="signup.html">
                Créer un compte
            </a>
        `;

        return;
    }


    // =============================================
    // USER LOGGED IN - CHECK ROLE
    // =============================================

    const user = session.user;

    const {
        data: roleData,
        error: roleError
    } = await sb
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();


    // =============================================
    // ADMIN USER
    // =============================================

    if (
        !roleError &&
        roleData &&
        roleData.role === "admin"
    ) {

        authNav.innerHTML = `
            <a href="admin.html">
                ⚙️ Administration
            </a>

            <a href="compte.html" class="nav-account-link">
                👤 Mon compte
            </a>
        `;

        return;
    }


    // =============================================
    // NORMAL LOGGED-IN USER
    // =============================================

    authNav.innerHTML = `
        <a href="compte.html" class="nav-account-link">
            👤 Mon compte
        </a>
    `;
}


// Run when page loads
updateAuthNavigation();


// Update navigation when login/logout changes
sb.auth.onAuthStateChange(() => {
    updateAuthNavigation();
});