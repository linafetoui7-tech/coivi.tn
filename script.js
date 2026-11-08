// Bouton du menu mobile
const menuBtn = document.querySelector('.menu-btn'); const links = document.querySelector('.links'); if (menuBtn) { menuBtn.addEventListener('click', () => links.classList.toggle('open')); }
// Démonstration de recherche sans base de données
const search = document.querySelector('#searchForm'); if (search) { search.addEventListener('submit', e => { e.preventDefault(); alert('Recherche enregistrée pour la démonstration. Aucun backend n’est connecté.'); }); }
// Validation simple du formulaire de contact
const contact = document.querySelector('#contactForm'); if (contact) { contact.addEventListener('submit', e => { e.preventDefault(); document.querySelector('#confirmation').style.display = 'block'; contact.reset(); }); }
