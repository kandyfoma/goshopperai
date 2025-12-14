import React, { useState } from 'react';
import './App.css';

function App() {
  const [currentSection, setCurrentSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = {
    home: <HomeSection />,
    privacy: <PrivacyPolicy />,
    terms: <TermsConditions />,
    support: <Support />
  };

  return (
    <div className="App">
      <header className="app-header">
        <nav className="nav-container">
          <div className="nav-brand" onClick={() => setCurrentSection('home')}>
            <div className="logo">
              <span className="logo-icon">🛒</span>
              <span className="logo-text">GoShopperAI</span>
            </div>
          </div>
          <div className={`nav-links ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <a href="#features" onClick={() => setCurrentSection('home')}>Fonctionnalités</a>
            <a href="#download" onClick={() => setCurrentSection('home')}>Télécharger</a>
            <a href="#privacy" onClick={() => setCurrentSection('privacy')}>Confidentialité</a>
            <a href="#terms" onClick={() => setCurrentSection('terms')}>Conditions</a>
            <a href="#support" onClick={() => setCurrentSection('support')}>Support</a>
          </div>
          <div className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <div className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </nav>
      </header>

      <main className="main-content">
        {sections[currentSection]}
      </main>

      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="logo">
              <span className="logo-icon">🛒</span>
              <span className="logo-text">GoShopperAI</span>
            </div>
            <p className="footer-desc">Numérisation intelligente des reçus alimentée par l'IA</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Produit</h4>
              <a href="#features" onClick={() => setCurrentSection('home')}>Fonctionnalités</a>
              <a href="#download" onClick={() => setCurrentSection('home')}>Télécharger</a>
            </div>
            <div className="footer-column">
              <h4>Juridique</h4>
              <a href="#privacy" onClick={() => setCurrentSection('privacy')}>Politique de confidentialité</a>
              <a href="#terms" onClick={() => setCurrentSection('terms')}>Conditions générales</a>
            </div>
            <div className="footer-column">
              <h4>Support</h4>
              <a href="#support" onClick={() => setCurrentSection('support')}>Centre d'aide</a>
              <a href="mailto:support@goshopperai.com">Nous contacter</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 GoShopperAI. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

function HomeSection() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Numérisation intelligente des reçus avec <span className="gradient-text">la puissance de l'IA</span>
            </h1>
            <p className="hero-subtitle">
              Transformez vos reçus en données de dépenses organisées en quelques secondes. GoShopperAI utilise l'apprentissage automatique avancé pour extraire automatiquement chaque détail.
            </p>
            <div className="hero-buttons">
              <a href="#download" className="btn btn-primary">
                <span className="btn-icon">📱</span>
                Télécharger gratuitement
              </a>
              <a href="#features" className="btn btn-secondary">
                <span className="btn-icon">✨</span>
                En savoir plus
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">10k+</div>
                <div className="stat-label">Utilisateurs actifs</div>
              </div>
              <div className="stat">
                <div className="stat-number">99.9%</div>
                <div className="stat-label">Précision</div>
              </div>
              <div className="stat">
                <div className="stat-number">5⭐</div>
                <div className="stat-label">Note App Store</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="app-preview">
                  <div className="scanning-animation">
                    <div className="scan-line"></div>
                    <div className="receipt-preview">
                      <div className="receipt-item">🏪 Carrefour Market</div>
                      <div className="receipt-item">🍞 Pain complet - 1.50€</div>
                      <div className="receipt-item">🥛 Lait bio - 2.30€</div>
                      <div className="receipt-item">💰 Total: 3.80€</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-container">
          <div className="section-header">
            <h2>Pourquoi choisir GoShopperAI ?</h2>
            <p>Découvrez l'avenir du suivi des dépenses avec nos fonctionnalités de pointe</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Numérisation alimentée par l'IA</h3>
              <p>L'apprentissage automatique avancé extrait le texte, les prix et les catégories de tout reçu avec une précision de 99,9 %.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mode hors ligne prioritaire</h3>
              <p>Numérisez les reçus sans connexion internet. Les données se synchronisent automatiquement lorsque vous êtes de retour en ligne.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏷️</div>
              <h3>Catégorisation intelligente</h3>
              <p>La catégorisation automatique des dépenses apprend de vos habitudes de dépenses pour une organisation personnalisée.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analyses des dépenses</h3>
              <p>Des insights détaillés et des graphiques vous aident à comprendre vos habitudes de dépenses et à économiser de l'argent.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Sécurité de niveau bancaire</h3>
              <p>Vos données financières sont protégées par un cryptage de niveau entreprise et un stockage cloud sécurisé.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Multilingue</h3>
              <p>Prend en charge les reçus en français, anglais et langues locales avec compréhension du contexte culturel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <h2>Comment ça marche</h2>
            <p>Trois étapes simples pour transformer vos reçus</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Prenez une photo</h3>
                <p>Prenez une photo de votre reçu avec l'appareil photo de votre téléphone</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>L'IA extrait les données</h3>
                <p>Notre IA lit instantanément et organise toutes les informations du reçu</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Suivez et analysez</h3>
                <p>Consultez des rapports de dépenses détaillés et des insights dans votre tableau de bord</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="download">
        <div className="section-container">
          <div className="download-content">
            <h2>Prêt à commencer ?</h2>
            <p>Rejoignez des milliers d'utilisateurs qui économisent déjà du temps et de l'argent avec GoShopperAI</p>
            <div className="download-buttons">
              <a href="#" className="download-btn android">
                <div className="download-icon">📱</div>
                <div className="download-text">
                  <span className="download-label">Téléchargez sur</span>
                  <span className="download-store">Google Play</span>
                </div>
              </a>
              <a href="#" className="download-btn ios">
                <div className="download-icon">📱</div>
                <div className="download-text">
                  <span className="download-label">Téléchargez sur</span>
                  <span className="download-store">l'App Store</span>
                </div>
              </a>
            </div>
            <p className="download-note">Téléchargement gratuit • Aucune carte de crédit requise • Disponible dans le monde entier</p>
          </div>
        </div>
      </section>
    </>
  );
}

function PrivacyPolicy() {
  return (
    <section className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <h1>Politique de confidentialité</h1>
          <p className="legal-date">Dernière mise à jour : 15 janvier 2025</p>
        </div>
        
        <div className="legal-content">
          <div className="legal-section">
            <h2>Informations que nous collectons</h2>
            <p>GoShopperAI s'engage à protéger votre vie privée. Nous collectons uniquement les informations minimales nécessaires pour fournir nos services :</p>
            <ul>
              <li><strong>Images de reçus :</strong> Les photos que vous prenez sont traitées localement sur votre appareil lorsque possible</li>
              <li><strong>Données extraites :</strong> Texte, montants et catégories extraits des reçus</li>
              <li><strong>Informations de compte :</strong> Adresse e-mail et informations de profil de base si vous créez un compte</li>
              <li><strong>Analyses d'utilisation :</strong> Statistiques anonymes d'utilisation de l'application pour améliorer notre service</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Comment nous utilisons vos informations</h2>
            <p>Vos données sont utilisées exclusivement pour fournir et améliorer les services GoShopperAI :</p>
            <ul>
              <li>Traitement des images de reçus pour extraire les informations de dépenses</li>
              <li>Stockage et organisation sécurisés de vos données de dépenses</li>
              <li>Fourniture d'analyses et d'insights sur les dépenses</li>
              <li>Amélioration de nos modèles d'IA pour une meilleure précision</li>
              <li>Envoi de mises à jour importantes du service (avec votre consentement)</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Sécurité et stockage des données</h2>
            <p>Nous mettons en œuvre des mesures de sécurité standard de l'industrie :</p>
            <ul>
              <li><strong>Cryptage :</strong> Toutes les données sont cryptées en transit et au repos</li>
              <li><strong>Traitement local :</strong> La numérisation des reçus est effectuée sur votre appareil lorsque possible</li>
              <li><strong>Stockage cloud sécurisé :</strong> Données stockées avec Firebase et sécurité d'entreprise</li>
              <li><strong>Contrôles d'accès :</strong> Politiques d'accès interne strictes et journaux d'audit</li>
              <li><strong>Minimisation des données :</strong> Nous stockons uniquement les informations nécessaires</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Partage des données</h2>
            <p>Nous ne vendons, n'échangeons ni ne partageons vos informations personnelles avec des tiers, sauf :</p>
            <ul>
              <li>Avec votre consentement explicite</li>
              <li>Pour nous conformer aux obligations légales</li>
              <li>Pour protéger nos droits et prévenir la fraude</li>
              <li>Avec des prestataires de services sous accords de confidentialité stricts</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Vos droits</h2>
            <p>Vous avez un contrôle total sur vos données :</p>
            <ul>
              <li><strong>Accès :</strong> Demander une copie de toutes vos données stockées</li>
              <li><strong>Correction :</strong> Mettre à jour ou corriger les informations inexactes</li>
              <li><strong>Suppression :</strong> Demander la suppression permanente de votre compte et de vos données</li>
              <li><strong>Portabilité :</strong> Exporter vos données dans un format lisible par machine</li>
              <li><strong>Désinscription :</strong> Vous désabonner des communications à tout moment</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Utilisateurs internationaux</h2>
            <p>GoShopperAI se conforme aux réglementations internationales sur la confidentialité, y compris le RGPD, la CCPA et d'autres lois régionales sur la confidentialité. Le traitement des données est effectué conformément aux normes de confidentialité les plus élevées, quel que soit votre lieu.</p>
          </div>

          <div className="legal-section">
            <h2>Confidentialité des enfants</h2>
            <p>GoShopperAI n'est pas destiné aux enfants de moins de 13 ans. Nous ne collectons pas sciemment d'informations personnelles auprès d'enfants de moins de 13 ans. Si vous pensez que nous avons collecté des informations auprès d'un enfant de moins de 13 ans, veuillez nous contacter immédiatement.</p>
          </div>

          <div className="legal-section">
            <h2>Modifications de cette politique</h2>
            <p>Nous pouvons mettre à jour cette politique de confidentialité périodiquement. Les utilisateurs seront informés des changements importants via l'application ou par e-mail. L'utilisation continue de GoShopperAI après les modifications constitue l'acceptation de la politique mise à jour.</p>
          </div>

          <div className="legal-section">
            <h2>Nous contacter</h2>
            <p>Si vous avez des questions sur cette politique de confidentialité ou nos pratiques de données, veuillez nous contacter :</p>
            <div className="contact-info">
              <p><strong>E-mail :</strong> privacy@goshopperai.com</p>
              <p><strong>Adresse :</strong> Équipe de confidentialité GoShopperAI<br/>123 Rue Tech<br/>Ville Innovation, IC 12345</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TermsConditions() {
  return (
    <section className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <h1>Conditions générales</h1>
          <p className="legal-date">Dernière mise à jour : 15 janvier 2025</p>
        </div>
        
        <div className="legal-content">
          <div className="legal-section">
            <h2>Acceptation des conditions</h2>
            <p>En téléchargeant, installant ou utilisant l'application mobile GoShopperAI ("Application"), vous acceptez d'être lié par ces Conditions générales ("Conditions"). Si vous n'acceptez pas ces Conditions, n'utilisez pas l'Application.</p>
          </div>

          <div className="legal-section">
            <h2>Description du service</h2>
            <p>GoShopperAI est une application mobile qui fournit :</p>
            <ul>
              <li>Numérisation et extraction de texte des reçus alimentée par l'IA</li>
              <li>Suivi et catégorisation des dépenses</li>
              <li>Analyses financières et insights</li>
              <li>Stockage cloud sécurisé et synchronisation</li>
              <li>Accès multi-appareils à vos données de dépenses</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Comptes utilisateurs</h2>
            <p>Pour accéder à certaines fonctionnalités, vous devrez peut-être créer un compte. Vous êtes responsable de :</p>
            <ul>
              <li>Maintenir la confidentialité de vos identifiants de compte</li>
              <li>Toutes les activités qui se déroulent sous votre compte</li>
              <li>Fournir des informations exactes et complètes</li>
              <li>Mettre à jour vos informations de compte rapidement si nécessaire</li>
              <li>Nous informer immédiatement de toute utilisation non autorisée</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Utilisation acceptable</h2>
            <p>Vous acceptez d'utiliser GoShopperAI uniquement à des fins légales et conformément à ces Conditions. Les activités interdites incluent :</p>
            <ul>
              <li>Utiliser l'Application à des fins illégales ou non autorisées</li>
              <li>Tenter de pirater, d'ingénierie inverse ou de compromettre l'Application</li>
              <li>Télécharger du contenu malveillant ou des virus</li>
              <li>Interférer avec le fonctionnement ou la sécurité de l'Application</li>
              <li>Violer toute loi ou réglementation applicable</li>
              <li>Usurper l'identité d'autrui ou fournir des informations fausses</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Propriété intellectuelle</h2>
            <p>L'Application GoShopperAI et tout son contenu, ses fonctionnalités et ses fonctionnalités sont la propriété de GoShopperAI et sont protégés par le droit d'auteur international, les marques et d'autres lois sur la propriété intellectuelle. Vous recevez une licence limitée, non exclusive et non transférable pour utiliser l'Application à des fins personnelles uniquement.</p>
          </div>

          <div className="legal-section">
            <h2>Précision des données</h2>
            <p>Bien que GoShopperAI s'efforce d'atteindre une haute précision dans la numérisation des reçus et l'extraction de données :</p>
            <ul>
              <li>Le traitement par IA peut occasionnellement produire des erreurs</li>
              <li>Les utilisateurs doivent vérifier l'exactitude des données extraites</li>
              <li>GoShopperAI n'est pas responsable des décisions financières basées sur les données extraites</li>
              <li>L'Application est un outil pour aider au suivi des dépenses, pas pour remplacer le jugement financier</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Confidentialité et données</h2>
            <p>Votre confidentialité est importante pour nous. Notre collecte, utilisation et protection de vos informations personnelles sont régies par notre Politique de confidentialité, qui est incorporée dans ces Conditions par référence.</p>
          </div>

          <div className="legal-section">
            <h2>Abonnement et paiements</h2>
            <p>GoShopperAI peut offrir des fonctionnalités premium via des plans d'abonnement :</p>
            <ul>
              <li>Les frais d'abonnement sont facturés à l'avance</li>
              <li>Les abonnements se renouvellent automatiquement sauf annulation</li>
              <li>Les remboursements sont régis par les politiques des app stores</li>
              <li>Nous pouvons modifier les prix d'abonnement avec préavis</li>
              <li>Les périodes d'essai gratuites peuvent être soumises à des conditions supplémentaires</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Avis de non-responsabilité</h2>
            <p>L'APPLICATION EST FOURNI "EN L'ÉTAT" SANS GARANTIES D'AUCUNE SORTE. GOSHOPPERAI DÉCLINE TOUTES LES GARANTIES, EXPRESSES OU IMPLICITES, Y COMPRIS MAIS SANS S'Y LIMITER :</p>
            <ul>
              <li>La qualité marchande et l'adaptation à un usage particulier</li>
              <li>La non-violation des droits de tiers</li>
              <li>L'exactitude, l'exhaustivité ou la fiabilité du contenu</li>
              <li>Le fonctionnement ininterrompu ou sans erreur</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Limitation de responsabilité</h2>
            <p>DANS LA MESURE MAXIMALE AUTORISÉE PAR LA LOI, GOSHOPPERAI NE SERA PAS RESPONSABLE DE TOUT DOMMAGE INDIRECT, ACCESSOIRE, SPÉCIAL, CONSÉCUTIF OU PUNITIF, Y COMPRIS MAIS SANS S'Y LIMITER LA PERTE DE PROFITS, DE DONNÉES OU D'UTILISATION, DÉCOULANT DE OU LIÉ À VOTRE UTILISATION DE L'APPLICATION.</p>
          </div>

          <div className="legal-section">
            <h2>Résiliation</h2>
            <p>Nous pouvons résilier ou suspendre votre compte et l'accès à l'Application à notre seule discrétion, sans préavis, pour un comportement que nous croyons violer ces Conditions ou nuire à d'autres utilisateurs, à nous ou à des tiers.</p>
          </div>

          <div className="legal-section">
            <h2>Loi applicable</h2>
            <p>Ces Conditions sont régies et interprétées conformément aux lois de [Votre Juridiction], sans égard aux principes de conflit de lois. Tout litige découlant de ces Conditions ou de votre utilisation de l'Application sera résolu devant les tribunaux de [Votre Juridiction].</p>
          </div>

          <div className="legal-section">
            <h2>Modifications des conditions</h2>
            <p>Nous nous réservons le droit de modifier ces Conditions à tout moment. Les modifications prendront effet lorsqu'elles seront publiées dans l'Application ou sur notre site web. Votre utilisation continue de l'Application après la publication des modifications constitue votre acceptation des Conditions modifiées.</p>
          </div>

          <div className="legal-section">
            <h2>Informations de contact</h2>
            <p>Si vous avez des questions sur ces Conditions générales, veuillez nous contacter :</p>
            <div className="contact-info">
              <p><strong>E-mail :</strong> legal@goshopperai.com</p>
              <p><strong>Support :</strong> support@goshopperai.com</p>
              <p><strong>Adresse :</strong> Équipe juridique GoShopperAI<br/>123 Rue Tech<br/>Ville Innovation, IC 12345</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Support() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    alert('Merci pour votre message ! Nous vous répondrons dans les 24 heures.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <section className="support-page">
      <div className="support-container">
        <div className="support-header">
          <h1>Centre de support</h1>
          <p>Nous sommes là pour vous aider ! Trouvez des réponses aux questions courantes ou contactez notre équipe de support.</p>
        </div>

        <div className="support-content">
          {/* FAQ Section */}
          <div className="faq-section">
            <h2>Questions fréquemment posées</h2>
            <div className="faq-grid">
              <div className="faq-item">
                <h3>Quelle est la précision de la numérisation des reçus ?</h3>
                <p>GoShopperAI atteint une précision de 99,9 % en utilisant des modèles d'IA avancés. L'application traite les reçus localement lorsque possible et utilise l'IA cloud pour les reçus complexes, assurant les taux de précision les plus élevés.</p>
              </div>
              <div className="faq-item">
                <h3>L'application fonctionne-t-elle hors ligne ?</h3>
                <p>Oui ! GoShopperAI peut numériser les reçus complètement hors ligne en utilisant des modèles ML sur l'appareil. Vos données se synchronisent automatiquement lorsque vous vous reconnectez à internet.</p>
              </div>
              <div className="faq-item">
                <h3>Mes données financières sont-elles sécurisées ?</h3>
                <p>Absolument. Nous utilisons un cryptage de niveau bancaire, traitons les données localement lorsque possible, et stockons les informations de manière sécurisée dans le cloud avec des mesures de sécurité de niveau entreprise.</p>
              </div>
              <div className="faq-item">
                <h3>Quels formats de reçus sont pris en charge ?</h3>
                <p>GoShopperAI prend en charge les reçus dans plusieurs langues et formats, y compris les reçus thermiques, les factures imprimées et les reçus numériques de divers détaillants dans le monde entier.</p>
              </div>
              <div className="faq-item">
                <h3>Puis-je exporter mes données de dépenses ?</h3>
                <p>Oui ! Vous pouvez exporter vos données de dépenses aux formats CSV, PDF ou Excel pour les impôts, les logiciels de comptabilité ou la tenue d'archives personnelles.</p>
              </div>
              <div className="faq-item">
                <h3>Comment annuler mon abonnement ?</h3>
                <p>Vous pouvez annuler votre abonnement à tout moment via les paramètres de votre compte app store. Vos fonctionnalités premium resteront actives jusqu'à la fin de votre période de facturation.</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-section">
            <h2>Contacter le support</h2>
            <p>Vous ne trouvez pas ce que vous cherchez ? Envoyez-nous un message et nous répondrons dans les 24 heures.</p>
            
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Nom complet</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Adresse e-mail</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="subject">Sujet</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionnez un sujet</option>
                  <option value="technical">Problème technique</option>
                  <option value="billing">Question de facturation</option>
                  <option value="feature">Demande de fonctionnalité</option>
                  <option value="data">Export de données</option>
                  <option value="account">Gestion de compte</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Veuillez décrire votre question ou problème en détail..."
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary">Envoyer le message</button>
            </form>
          </div>

          {/* Contact Methods */}
          <div className="contact-methods">
            <h2>Autres moyens de nous joindre</h2>
            <div className="contact-grid">
              <div className="contact-method">
                <div className="contact-icon">📧</div>
                <h3>Support par e-mail</h3>
                <p>support@goshopperai.com</p>
                <p>Réponse dans les 24 heures</p>
              </div>
              <div className="contact-method">
                <div className="contact-icon">💬</div>
                <h3>Chat en direct</h3>
                <p>Disponible dans l'application</p>
                <p>Lundi - Vendredi, 9h - 18h</p>
              </div>
              <div className="contact-method">
                <div className="contact-icon">📚</div>
                <h3>Documentation</h3>
                <p>Guides complets et tutoriels</p>
                <p>Disponible 24/7</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;