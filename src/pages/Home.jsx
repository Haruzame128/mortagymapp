
import React, { useState, useEffect } from 'react'
import Contacto from '../components/Contacto'
import logo from '../assets/logo_sf.png'
import foto1 from '../assets/foto4.jpg'
import foto2 from '../assets/foto9.jpg'
import foto3 from '../assets/foto5.jpeg'
import foto4 from '../assets/foto6.jpg'
import { RiCalendarScheduleFill, RiPhoneFill, RiMapPin2Fill, RiInstagramFill } from '@remixicon/react'
import { serviciosApi } from '../services/api'

import '../styles/Home.css'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Home() {
  const [servicios, setServicios] = useState([])

  useEffect(() => {
    serviciosApi.getPublicos()
      .then(data => setServicios(data))
      .catch(() => {}) // si falla no rompe la página
  }, [])

  return (
    <div className="home-container">
      {/* Hero */}
      <section className="hero-simple d-flex flex-column align-items-center justify-content-center text-center">
        <img src={logo} alt="Morta Gym" className="hero-logo mb-3" />
        <h1 className="titulo-pagina hero-title">Bienvenido a Morta Gym</h1>
        <p className="hero-sub mt-3">
          Entrená con profesionales, equipos de alta calidad y un plan pensado para vos.
        </p>
      </section>

      {/* Quiénes Somos */}
      <section className="home-section">
        <div className="qs-content">
          <h2 className="qs-titulo ps-2">Quiénes Somos</h2>
          <div className="row">
            <div className="col-12 col-md-6 px-4">
              <div className="qs-texto">
                <p className="fs-5">
                  En <span className="fw-bold">Morta Gym</span> creemos en el esfuerzo
                  constante y la disciplina como camino a la transformación.
                  Somos más que un gimnasio: un espacio pensado para motivarte e inspirarte.
                </p>
                <p className="fs-5">
                  Contamos con diversas disciplinas para todos los gustos:{" "}
                  <strong>Pilates, Musculación, </strong> una{" "}
                  <strong>pileta climatizada</strong> para entrenamientos funcionales y natación.
                </p>
                <p className="fs-5">
                  Nuestro equipo de profesionales está listo para acompañarte en cada paso hacia tu mejor versión.
                </p>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div id="carouselQuienesSomos" className="carousel slide">
                <div className="carousel-inner">
                  {[foto1, foto2, foto3, foto4].map((foto, i) => (
                    <div key={i} className={`carousel-item ${i === 0 ? 'active' : ''}`}>
                      <img src={foto} className="d-block" alt={`Actividad ${i + 1}`} />
                    </div>
                  ))}
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#carouselQuienesSomos" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#carouselQuienesSomos" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Next</span>
                </button>
                <div className="carousel-indicators">
                  {[0, 1, 2, 3].map((i) => (
                    <button key={i} type="button" data-bs-target="#carouselQuienesSomos"
                      data-bs-slide-to={i} className={i === 0 ? 'active' : ''}
                      aria-label={`Slide ${i + 1}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios — dinámicos desde la DB */}
      {servicios.length > 0 && (
        <section id="servicio" className="contacto-section">
          <div className="container mt-5">
            <h2 className="qs-titulo text-center mb-3">Nuestros Servicios</h2>
            <div className="row g-4">
              {servicios.map((s) => (
                <div key={s.id_servicio} className="col-12 col-md-4">
                  <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                    {s.imagen_s && (
                      <div className="card-img">
                        <img
                          src={`${BASE_URL}${s.imagen_s}`}
                          className="card-img-top"
                          alt={s.nombre_s}
                        />
                      </div>
                    )}
                    <div className="card-body text-center">
                      <h5 className="card-title fw-bold">{s.nombre_s}</h5>
                      <p className="card-text">{s.descripcion_s}</p>
                      {s.extra_s && (
                        <p className="dato-servicio">{s.extra_s}</p>
                      )}
                      {s.redes_s && (
                        <p className="dato-servicio">
                          <a className="enlace" href={s.redes_s} target="_blank" rel="noopener noreferrer">
                            <RiInstagramFill size={24} /> Ver en Instagram
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contacto */}
      <section id="contacto" className="contacto-section">
        <div className="container mt-5">
          <h2 className="qs-titulo">Contacto</h2>
          <div className="contacto-datos row">
            <div className="col-12 col-md-4">
              <div className="dato-contacto">
                <div className="icon-contacto"><RiPhoneFill size={25} color="white" /></div>
                <div>
                  <p className="titulo-dato-contacto">Teléfono</p>
                  <p className="texto-dato-contacto">297 5014149</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="dato-contacto">
                <div className="icon-contacto"><RiCalendarScheduleFill size={25} color="white" /></div>
                <div>
                  <p className="titulo-dato-contacto">Horario</p>
                  <p className="texto-dato-contacto">Lunes a Viernes: 7:00 a 22:00 Hs</p>
                  <p className="texto-dato-contacto">Sábados: 10:00 a 14:00 Hs</p>
                  <p className="texto-dato-contacto">Domingos: Cerrado</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="dato-contacto">
                <div className="icon-contacto"><RiMapPin2Fill size={25} color="white" /></div>
                <div>
                  <p className="titulo-dato-contacto">Dirección</p>
                  <p className="texto-dato-contacto">Surinam 1190, Caleta Olivia</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mapa-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6838.010047574578!2d-67.54018115240513!3d-46.4383044!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xbde5df0017c63c93%3A0x4015e9afe045e2e3!2sMORTA%20GYM!5e1!3m2!1ses-419!2sar!4v1760648444773!5m2!1ses-419!2sar"
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  )
}