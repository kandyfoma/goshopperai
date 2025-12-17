import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

// Component to handle internal page scrolling
function ScrollLink({ to, children, className, onClick }) {
  
  const handleClick = (e) => {
    if (to.startsWith('#')) {
      e.preventDefault();
      const element = document.getElementById(to.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (to.includes('#')) {
      e.preventDefault();
      const [path, hash] = to.split('#');
      if (window.location.pathname !== path) {
        window.location.href = to;
      } else {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    if (onClick) onClick();
  };

  if (to.startsWith('#') || to.includes('#')) {
    return (
      <a href={to} className={className} onClick={handleClick}>
        {children}
      </a>
    );
  }

  return (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="app-header">
      <nav className="nav-container">
        <Link to="/" className="nav-brand">
          <div className="logo">
            <img src="/logo.png" alt="GoShopper" className="logo-icon" />
            <span className="logo-text">GoShopper</span>
          </div>
        </Link>
        <div className={`nav-links ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <ScrollLink to="/#features" onClick={closeMobileMenu}>Fonctionnalités</ScrollLink>
          <ScrollLink to="/#download" onClick={closeMobileMenu}>Télécharger</ScrollLink>
          <ScrollLink to="/privacy" onClick={closeMobileMenu}>Confidentialité</ScrollLink>
          <ScrollLink to="/terms" onClick={closeMobileMenu}>Conditions</ScrollLink>
          <ScrollLink to="/support" onClick={closeMobileMenu}>Support</ScrollLink>
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
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomeSection />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsConditions />} />
            <Route path="/support" element={<Support />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-container">
            <div className="footer-brand">
              <div className="logo" itemScope itemType="https://schema.org/Organization">
                <img src="/logo.png" alt="GoShopper - Application de scan de reçus RDC" className="logo-icon" itemProp="logo" />
                <span className="logo-text" itemProp="name">GoShopper</span>
              </div>
              <p className="footer-desc" itemProp="description">Application révolutionnaire avec IA pour scan de reçus, comparaison de prix et mobile money en République Démocratique du Congo</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Produit</h4>
                <ScrollLink to="/#features">Fonctionnalités</ScrollLink>
                <ScrollLink to="/#download">Télécharger</ScrollLink>
              </div>
              <div className="footer-column">
                <h4>Juridique</h4>
                <ScrollLink to="/privacy">Politique de confidentialité</ScrollLink>
                <ScrollLink to="/terms">Conditions générales</ScrollLink>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <ScrollLink to="/support">Centre d'aide</ScrollLink>
                <a href="mailto:support@goshopper.app" itemProp="email">Nous contacter</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 GoShopper. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

function HomeSection() {
  useEffect(() => {
    document.title = 'GoShopper - Scan de Reçus Intelligent et Comparaison de Prix en RDC';
    
    // Update meta description for home page
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Application mobile révolutionnaire avec IA pour scanner vos reçus, comparer les prix et gérer vos dépenses en RDC. Paiements mobile money M-Pesa, Orange Money, Airtel Money.');
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'GoShopper - Scan de Reçus Intelligent et Comparaison de Prix en RDC');
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', 'https://goshopper.app/');
    }
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Scan de Reçus Intelligent RDC avec <span className="gradient-text">Intelligence Artificielle</span>
            </h1>
            <p className="hero-subtitle">
              Transformez vos reçus en données organisées en quelques secondes. GoShopper utilise l'IA avancée pour extraire automatiquement chaque détail et comparer les prix à Kinshasa et partout en RDC.
            </p>
            <div className="hero-buttons">
              <ScrollLink to="#download" className="btn btn-primary">
                <span className="btn-icon">📱</span>
                Télécharger gratuitement
              </ScrollLink>
              <ScrollLink to="#features" className="btn btn-secondary">
                <span className="btn-icon">✨</span>
                En savoir plus
              </ScrollLink>
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
                <img src="/app-screenshot.jpg" alt="Interface de l'application GoShopper montrant le scan de reçus intelligent et la comparaison de prix en RDC" className="app-screenshot" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-container">
          <div className="section-header">
            <h2>Pourquoi Choisir GoShopper en RDC ?</h2>
            <p>Découvrez l'avenir de la gestion des dépenses avec nos fonctionnalités révolutionnaires adaptées au marché congolais</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Scan IA Précis - Reçus RDC</h3>
              <p>Intelligence artificielle avancée qui extrait automatiquement texte, prix et catégories de vos reçus congolais avec 99,9% de précision.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Fonctionnement Hors Ligne</h3>
              <p>Scannez vos reçus même sans internet à Kinshasa. Synchronisation automatique dès le retour de connexion.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏷️</div>
              <h3>Catégorisation Intelligente RDC</h3>
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
                <div className="download-icon google-play">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                </div>
                <div className="download-text">
                  <span className="download-label">Téléchargez sur</span>
                  <span className="download-store">Google Play</span>
                </div>
              </a>
              <a href="#" className="download-btn ios">
                <div className="download-icon app-store">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.18 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                  </svg>
                </div>
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
  useEffect(() => {
    document.title = 'Politique de Confidentialité | GoShopper - Protection des Données en RDC';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Politique de confidentialité GoShopper - Comment nous protégeons vos données personnelles et respectons votre vie privée en République Démocratique du Congo.');
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Politique de Confidentialité | GoShopper');
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', 'https://goshopper.app/privacy');
    }
  }, []);

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
              <p><strong>E-mail :</strong> privacy@goshopper.app</p>
              <p><strong>Adresse :</strong> Équipe de confidentialité GoShopperAI<br/>123 Rue Tech<br/>Ville Innovation, IC 12345</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TermsConditions() {
  useEffect(() => {
    document.title = 'Conditions Générales d\'Utilisation | GoShopper - Termes et Services';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Conditions générales d\'utilisation de GoShopper - Termes, règles et conditions pour utiliser notre application de scan de reçus en République Démocratique du Congo.');
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Conditions Générales | GoShopper');
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', 'https://goshopper.app/terms');
    }
  }, []);

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
              <p><strong>E-mail :</strong> legal@goshopper.app</p>
              <p><strong>Support :</strong> support@goshopper.app</p>
              <p><strong>Adresse :</strong> Équipe juridique GoShopperAI<br/>123 Rue Tech<br/>Ville Innovation, IC 12345</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NotFound() {
  useEffect(() => {
    document.title = '404 - Page Non Trouvée | GoShopper - Erreur de Navigation';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Page non trouvée sur GoShopper. Retournez à l\'accueil pour découvrir notre application de scan de reçus et comparaison de prix en RDC.');
    }
  }, []);

  return (
    <section className="not-found-page">
      <div className="container">
        <div className="not-found-content">
          <h1>404</h1>
          <h2>Page non trouvée</h2>
          <p>Désolé, la page que vous recherchez n'existe pas.</p>
          <Link to="/" className="btn btn-primary">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </section>
  );
}

function Support() {
  useEffect(() => {
    document.title = 'Centre d\'Aide et Support | GoShopper - FAQ et Assistance RDC';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Centre d\'aide GoShopper - FAQ, guides d\'utilisation, support technique pour scan de reçus, mobile money et comparaison de prix en République Démocratique du Congo.');
    }
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Centre d\'Aide et Support | GoShopper');
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', 'https://goshopper.app/support');
    }
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [activeCategory, setActiveCategory] = useState('general');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

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

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const faqCategories = {
    general: {
      title: 'Utilisation générale',
      items: [
        {
          id: 'scan-receipt',
          question: 'Comment scanner un ticket de caisse ?',
          answer: 'Ouvrez l\'app GoShopper, appuyez sur l\'onglet "Scanner" en bas de l\'écran, puis prenez une photo claire de votre ticket. L\'IA analysera automatiquement tous les articles, prix et informations du magasin. Assurez-vous que le ticket est bien éclairé et que tous les éléments sont visibles.'
        },
        {
          id: 'edit-scanned',
          question: 'Puis-je modifier les informations scannées ?',
          answer: 'Oui ! Après le scan, vous pouvez modifier tous les éléments : noms d\'articles, prix, quantités, et même ajouter ou supprimer des articles. Appuyez simplement sur l\'élément que vous souhaitez modifier dans la liste.'
        },
        {
          id: 'accuracy',
          question: 'Quelle est la précision de la numérisation ?',
          answer: 'GoShopper utilise l\'IA Gemini 2.5 Flash de Google pour atteindre une précision de plus de 95% sur les tickets clairs. L\'application traite d\'abord localement avec l\'OCR intégré, puis utilise l\'IA cloud pour les cas complexes.'
        },
        {
          id: 'offline',
          question: 'L\'application fonctionne-t-elle hors ligne ?',
          answer: 'Oui ! GoShopper peut scanner les tickets complètement hors ligne grâce à l\'OCR local intégré. Vos données se synchronisent automatiquement dès que vous vous reconnectez à Internet.'
        }
      ]
    },
    pricing: {
      title: 'Prix et abonnements',
      items: [
        {
          id: 'pricing-plans',
          question: 'Quels sont les tarifs d\'abonnement ?',
          answer: 'GoShopper propose : Essai gratuit (2 mois, illimité), Plan Basic (1,99$/mois - 25 scans), Plan Standard (2,99$/mois - 100 scans), Plan Premium (4,99$/mois - illimité). Les prix en RDC sont : Basic 8 000 FC, Standard 12 000 FC, Premium 20 000 FC.'
        },
        {
          id: 'payment-methods',
          question: 'Quels moyens de paiement sont acceptés ?',
          answer: 'En RDC : Mobile Money (M-Pesa, Orange Money, Airtel Money, AfriMoney) et cartes Visa. À l\'international : cartes Visa/Mastercard via Stripe. Tous les paiements sont sécurisés et chiffrés.'
        },
        {
          id: 'free-trial',
          question: 'Comment fonctionne l\'essai gratuit ?',
          answer: 'Nouveaux utilisateurs bénéficient de 2 mois d\'accès illimité gratuit. Aucune carte de crédit requise. Vous pouvez scanner autant de tickets que vous voulez pendant cette période.'
        },
        {
          id: 'cancel-subscription',
          question: 'Comment annuler mon abonnement ?',
          answer: 'Vous pouvez annuler à tout moment dans Paramètres > Abonnement dans l\'app, ou via votre compte App Store/Google Play. Vos fonctionnalités premium restent actives jusqu\'à la fin de la période payée.'
        }
      ]
    },
    features: {
      title: 'Fonctionnalités',
      items: [
        {
          id: 'price-comparison',
          question: 'Comment fonctionne la comparaison de prix ?',
          answer: 'GoShopper compare automatiquement les prix de vos articles scannés avec d\'autres magasins de votre région. Vous recevez des suggestions d\'économies et pouvez voir l\'historique des prix pour chaque produit.'
        },
        {
          id: 'price-alerts',
          question: 'Comment créer des alertes de prix ?',
          answer: 'Allez dans Paramètres > Alertes de prix, ou appuyez sur l\'icône cloche à côté d\'un article. Définissez un prix cible et vous recevrez une notification quand le prix baisse dans les magasins environnants.'
        },
        {
          id: 'export-data',
          question: 'Puis-je exporter mes données ?',
          answer: 'Oui ! Exportez vos listes d\'achats et historique au format PDF, CSV ou Excel. Parfait pour la comptabilité personnelle, les déclarations fiscales ou l\'analyse budgétaire.'
        },
        {
          id: 'ai-assistant',
          question: 'Comment utiliser l\'assistant IA ?',
          answer: 'L\'assistant IA analyse vos habitudes d\'achat pour vous suggérer des économies, alternatives de produits moins chers, et optimiser votre budget. Accessible via l\'onglet "Assistant" dans l\'app.'
        }
      ]
    },
    technical: {
      title: 'Problèmes techniques',
      items: [
        {
          id: 'scan-quality',
          question: 'Mes tickets ne se scannent pas correctement',
          answer: 'Assurez-vous : 1) Éclairage suffisant, 2) Ticket bien étalé sans plis, 3) Tenir le téléphone stable, 4) Cadrer tout le ticket dans l\'écran. Si le problème persiste, utilisez le mode correction manuelle.'
        },
        {
          id: 'sync-issues',
          question: 'Mes données ne se synchronisent pas',
          answer: 'Vérifiez votre connexion Internet. Les données se synchronisent automatiquement en arrière-plan. Si le problème persiste, allez dans Paramètres > Synchronisation > Forcer la sync.'
        },
        {
          id: 'app-crashes',
          question: 'L\'application plante souvent',
          answer: 'Essayez : 1) Redémarrer l\'app, 2) Vider le cache (Android), 3) Mettre à jour vers la dernière version, 4) Redémarrer votre téléphone. Si ça continue, contactez le support avec votre modèle de téléphone.'
        },
        {
          id: 'storage-space',
          question: 'L\'app prend trop d\'espace de stockage',
          answer: 'GoShopper optimise automatiquement le stockage. Vous pouvez supprimer les anciens tickets dans Historique > Gérer le stockage. Les données importantes restent synchronisées dans le cloud.'
        }
      ]
    },
    account: {
      title: 'Compte et sécurité',
      items: [
        {
          id: 'data-security',
          question: 'Mes données financières sont-elles sécurisées ?',
          answer: 'Absolument. GoShopper utilise un chiffrement AES-256 (niveau bancaire), stockage sécurisé Firebase, et ne collecte jamais d\'informations de carte bancaire. Toutes les données sont anonymisées et protégées.'
        },
        {
          id: 'account-deletion',
          question: 'Comment supprimer mon compte ?',
          answer: 'Allez dans Paramètres > Compte > Supprimer mes données. Attention : cette action est irréversible et supprimera définitivement tous vos tickets, historiques et paramètres.'
        },
        {
          id: 'data-backup',
          question: 'Mes données sont-elles sauvegardées ?',
          answer: 'Oui, toutes vos données sont automatiquement sauvegardées dans le cloud Firebase. Si vous changez de téléphone, reconnectez-vous simplement pour récupérer toutes vos informations.'
        },
        {
          id: 'multiple-devices',
          question: 'Puis-je utiliser l\'app sur plusieurs appareils ?',
          answer: 'Oui ! Votre compte GoShopper se synchronise sur tous vos appareils. Téléchargez simplement l\'app et connectez-vous avec le même compte pour accéder à toutes vos données.'
        }
      ]
    }
  };

  return (
    <section className="support-page">
      <div className="support-container">
        <div className="support-header">
          <h1>Centre de support GoShopper</h1>
          <p>Trouvez des réponses complètes sur l'utilisation de GoShopper, les paiements mobile money, et toutes les fonctionnalités de votre assistant shopping IA.</p>
        </div>

        <div className="support-content">
          {/* Quick Stats */}
          <div className="support-stats">
            <div className="stat-item">
              <div className="stat-number">95%+</div>
              <div className="stat-label">Précision OCR</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">4</div>
              <div className="stat-label">Moyens de paiement mobile</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24h</div>
              <div className="stat-label">Support client</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2 mois</div>
              <div className="stat-label">Essai gratuit</div>
            </div>
          </div>

          {/* FAQ Section with Categories */}
          <div className="faq-section">
            <h2>Questions fréquemment posées</h2>
            
            {/* Category Tabs */}
            <div className="faq-categories">
              {Object.entries(faqCategories).map(([key, category]) => (
                <button
                  key={key}
                  className={`category-tab ${activeCategory === key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(key)}
                >
                  {category.title}
                </button>
              ))}
            </div>

            {/* FAQ Items */}
            <div className="faq-items">
              {faqCategories[activeCategory].items.map((item) => (
                <div key={item.id} className="faq-item-expandable">
                  <button 
                    className="faq-question" 
                    onClick={() => toggleFAQ(item.id)}
                  >
                    <span>{item.question}</span>
                    <span className={`faq-toggle ${expandedFAQ === item.id ? 'open' : ''}`}>▼</span>
                  </button>
                  {expandedFAQ === item.id && (
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting Guide */}
          <div className="troubleshooting-section">
            <h2>🔧 Guide de dépannage</h2>
            <div className="troubleshooting-grid">
              <div className="troubleshooting-item">
                <div className="trouble-icon">📱</div>
                <h3>Problèmes de scan</h3>
                <ul>
                  <li>Vérifiez l'éclairage (lumière naturelle idéale)</li>
                  <li>Étalez complètement le ticket</li>
                  <li>Tenez le téléphone stable à 20-30cm</li>
                  <li>Nettoyez l'objectif de votre appareil photo</li>
                </ul>
              </div>
              <div className="troubleshooting-item">
                <div className="trouble-icon">💳</div>
                <h3>Problèmes de paiement Mobile Money</h3>
                <ul>
                  <li>Vérifiez le solde de votre portefeuille mobile</li>
                  <li>Confirmez le numéro de téléphone (+243...)</li>
                  <li>Assurez-vous d'avoir une connexion stable</li>
                  <li>Vérifiez vos SMS pour les codes de confirmation</li>
                </ul>
              </div>
              <div className="troubleshooting-item">
                <div className="trouble-icon">🔄</div>
                <h3>Problèmes de synchronisation</h3>
                <ul>
                  <li>Vérifiez votre connexion Internet</li>
                  <li>Forcez la synchronisation dans Paramètres</li>
                  <li>Redémarrez l'application</li>
                  <li>Vérifiez l'espace de stockage disponible</li>
                </ul>
              </div>
              <div className="troubleshooting-item">
                <div className="trouble-icon">⚡</div>
                <h3>Performance lente</h3>
                <ul>
                  <li>Fermez les autres applications</li>
                  <li>Redémarrez votre téléphone</li>
                  <li>Vérifiez les mises à jour de l'app</li>
                  <li>Libérez de l'espace de stockage</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="payment-info-section">
            <h2>💰 Information sur les paiements</h2>
            <div className="payment-grid">
              <div className="payment-method-info">
                <h3>🇨🇩 Paiements en RDC</h3>
                <div className="mobile-money-options">
                  <div className="mm-option">
                    <img src="/m-pesa.png" alt="M-Pesa" className="mm-logo" />
                    <div>
                      <strong>M-Pesa</strong>
                      <p>Vodacom - Paiement instantané</p>
                    </div>
                  </div>
                  <div className="mm-option">
                    <img src="/orange-money.png" alt="Orange Money" className="mm-logo" />
                    <div>
                      <strong>Orange Money</strong>
                      <p>Orange - Confirmation par SMS</p>
                    </div>
                  </div>
                  <div className="mm-option">
                    <img src="/airtal-money.png" alt="Airtel Money" className="mm-logo" />
                    <div>
                      <strong>Airtel Money</strong>
                      <p>Airtel - Sécurisé par PIN</p>
                    </div>
                  </div>
                  <div className="mm-option">
                    <img src="/afrimoney.png" alt="AfriMoney" className="mm-logo" />
                    <div>
                      <strong>AfriMoney</strong>
                      <p>Tigo - Transaction rapide</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pricing-info">
                <h3>💲 Tarifs transparents</h3>
                <div className="pricing-table">
                  <div className="price-row">
                    <span>Basic (25 scans/mois)</span>
                    <span>1,99$ / 8 000 FC</span>
                  </div>
                  <div className="price-row">
                    <span>Standard (100 scans/mois)</span>
                    <span>2,99$ / 12 000 FC</span>
                  </div>
                  <div className="price-row premium">
                    <span>Premium (Illimité)</span>
                    <span>4,99$ / 20 000 FC</span>
                  </div>
                </div>
                <p className="pricing-note">
                  ✅ Essai gratuit de 2 mois<br/>
                  ✅ Aucune carte requise<br/>
                  ✅ Annulation en un clic
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-section">
            <h2>✉️ Contacter le support</h2>
            <p>Vous ne trouvez pas ce que vous cherchez ? Notre équipe vous répondra dans les 24 heures.</p>
            
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
                  <option value="billing">Question de facturation Mobile Money</option>
                  <option value="feature">Demande de fonctionnalité</option>
                  <option value="scan-issue">Problème de scan OCR</option>
                  <option value="data">Export de données</option>
                  <option value="account">Gestion de compte</option>
                  <option value="partnership">Partenariat magasin</option>
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
                  placeholder="Décrivez votre question en détail. Pour les problèmes techniques, précisez votre modèle de téléphone et version de l'app..."
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary">Envoyer le message</button>
            </form>
          </div>

          {/* Contact Methods */}
          <div className="contact-methods">
            <h2>📞 Autres moyens de nous joindre</h2>
            <div className="contact-grid">
              <div className="contact-method">
                <div className="contact-icon">📧</div>
                <h3>Support par e-mail</h3>
                <p>support@goshopper.app</p>
                <p>Réponse dans les 24 heures</p>
              </div>
              <div className="contact-method">
                <div className="contact-icon">💬</div>
                <h3>Chat en direct</h3>
                <p>Disponible dans l'application</p>
                <p>Lundi - Vendredi, 9h - 18h WAT</p>
              </div>
              <div className="contact-method">
                <div className="contact-icon">📚</div>
                <h3>Documentation</h3>
                <p>Guides complets et tutoriels</p>
                <p>Disponible 24/7</p>
              </div>
              <div className="contact-method">
                <div className="contact-icon">🏪</div>
                <h3>Partenariats magasins</h3>
                <p>partnerships@goshopper.app</p>
                <p>Intégration points de vente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;