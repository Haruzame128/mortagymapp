
import React, { useState } from 'react'
import { useNavigate } from "react-router-dom";
import Modal from 'react-modal';
import TablaNatacion from './TablaNatacion';

Modal.setAppElement('#root'); 

export default function Disciplina({ 
  titulo, 
  descripcion, 
  subactividad, 
  precios = {}, 
  fotos, 
  actividades = [],
  reverse = false,
  //modalData = [],
  matricula
}) {

  const opcionesDias = Object.keys(precios);
  const [dias, setDias] = useState(opcionesDias[0] || "");
  const [central, setCentral] = useState(fotos[0]);
  //const [isModalOpen, setIsModalOpen] = useState(false);
  //const [activeTab, setActiveTab] = useState(modalData[0]?.id || '');

  const navigate = useNavigate();
  const irAHorarios = () => navigate("/horarios", { state: { filtro: titulo } });

  const precioSeleccionado = precios[dias];
  const tieneUnaSolaOpcion = opcionesDias.length === 1;
  const tieneUnaFoto = fotos.length === 1;

  return (
    <>
      <section className="contenedor-disciplina py-12 py-lg-24 py-xl-32">
                  <div className="row align-items-stretch">

          {/* Info */}
          <div className={`col-lg-6 ${reverse ? "order-lg-2" : "order-lg-1"}`}>
            <div className="info mw-lg mx-auto mx-lg-0">
              <h3 className="titulo-actividad mb-8" translate="no">{titulo}</h3>
              <div className="descripcion-actividad d-sm-flex mb-14">
                <p>{descripcion}</p>
              </div>
              <div className="sub-actividad">
                <p>{subactividad}</p>
              </div>

              {titulo === "Natación" ? (
                <TablaNatacion actividades={actividades} matricula={matricula} />
              ) : (
                <div className="precios">
                  <table className='tabla-precios table table-borderless'>
                    <thead>
                      <tr>
                        <th>Cantidad de días por semana</th>
                        <th>Efectivo</th>
                        <th>Débito/Transferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td data-label="Días por semana">
                          {!tieneUnaSolaOpcion ? (
                            <select value={dias} onChange={(e) => setDias(e.target.value)}>
                              {opcionesDias.map((dia) => (
                                <option key={dia} value={dia}>
                                  {dia === "clase"
                                    ? "1 clase por día"
                                    : `${dia} ${dia === "1" ? "vez" : "veces"} por semana`}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>
                              {opcionesDias[0] === "clase"
                                ? "3 veces por semana"
                                : `${opcionesDias[0]} veces por semana`}
                            </span>
                          )}
                        </td>
                        <td data-label="Efectivo">
                          {precioSeleccionado
                            ? <span>${precioSeleccionado.efectivo.toLocaleString()}</span>
                            : <span>-</span>}
                        </td>
                        <td data-label="Débito/Transferencia">
                          {precioSeleccionado
                            ? <span>${precioSeleccionado.debito.toLocaleString()}</span>
                            : <span>-</span>}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3">
                          <p className="text-muted">Con tarjeta de crédito: +25%</p>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="btns">
                <button className="btn-principal btn btn-sm" type="button" onClick={irAHorarios}>
                  <span>HORARIO</span>
                </button>
                {/*modalData && modalData.length > 0 && (
                  <>
                    <button type="button" className="btn-secundario btn btn-sm"
                      onClick={() => setIsModalOpen(true)}>
                      Actividades
                    </button>
                    <Modal
                      isOpen={isModalOpen}
                      onRequestClose={() => setIsModalOpen(false)}
                      contentLabel="Actividades"
                      className="modal-react"
                      overlayClassName="modal-overlay"
                    >
                      <div className="modal-header">
                        <ul className="nav nav-tabs">
                          {modalData.map((tab) => (
                            <li key={tab.id} className="nav-item">
                              <button
                                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                              >
                                {tab.titulo}
                              </button>
                            </li>
                          ))}
                        </ul>
                        <button type="button" className="close" onClick={() => setIsModalOpen(false)}>
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">
                        <div className="tab-content mt-3 mb-2">
                          {modalData.map((tab) =>
                            activeTab === tab.id && (
                              <div key={tab.id} className="tab-actividad">
                                <p>{tab.descripcion}</p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                          Cerrar
                        </button>
                      </div>
                    </Modal>
                  </>
                )*/}
              </div>
            </div>
          </div>

          {/* Carrusel */}
          <div className={`carrusel-actividad col-lg-6 h-100 ${reverse ? "order-lg-1" : "order-lg-2"}`}>
            {tieneUnaFoto ? (
              <div className="d-flex justify-content-center w-100" style={{ alignSelf: 'center', minHeight: '400px', alignItems: 'center' }}>
                <div className="foto grande foto-unica">
                  <img src={central.src} alt="central" />
                  <div className="overlay"></div>
                </div>
              </div>
            ) : (
              // Varias fotos — layout normal con laterales
              <>
                <div className="foto grande">
                  <img src={central.src} alt="central" />
                  <div className="overlay"></div>
                </div>
                <div className={`laterales ${fotos.filter(f => f.id !== central.id).length === 1 ? 'laterales-centrado' : ''}`}>
                  {fotos
                    .filter((f) => f.id !== central.id)
                    .map((f) => (
                      <div key={f.id} className="foto chica" onClick={() => setCentral(f)}>
                        <img src={f.src} alt={`foto-${f.id}`} />
                        <div className="overlay"></div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>

        </div>
      </section>
    </>
  )
}
