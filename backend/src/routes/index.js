const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const {
  authMiddleware,
  soloAdmin,
  adminOInstructor,
} = require("../middleware/auth");
const authCtrl = require("../controllers/authController");
const alumnosCtrl = require("../controllers/alumnosController");
const clasesCtrl = require("../controllers/clasesController");
const reservacionesCtrl = require("../controllers/reservacionesController");
const pagosCtrl = require("../controllers/pagosController");
const inscripcionesCtrl = require("../controllers/inscripcionesController");
const gastosCtrl = require("../controllers/gastosController");

// Auth
router.post("/auth/login", authCtrl.login);
router.post("/auth/inscripcion", authCtrl.inscripcionPublica);
router.post("/auth/register", authMiddleware, soloAdmin, authCtrl.registrar);
router.get("/auth/me", authMiddleware, authCtrl.perfil);
router.post("/auth/cambiar-password", authMiddleware, authCtrl.cambiarPassword);
router.post(
  "/auth/resetear-password/:usuarioId",
  authMiddleware,
  soloAdmin,
  authCtrl.resetearPassword,
);

// Alumnos
router.get(
  "/alumnos",
  authMiddleware,
  adminOInstructor,
  alumnosCtrl.listarAlumnos,
);
router.get("/alumnos/:id", authMiddleware, alumnosCtrl.obtenerAlumno);
router.get(
  "/alumnos/:id/asistencia",
  authMiddleware,
  adminOInstructor,
  alumnosCtrl.asistenciaAlumno,
);
router.put("/alumnos/:id", authMiddleware, alumnosCtrl.actualizarAlumno);
router.delete(
  "/alumnos/:id",
  authMiddleware,
  soloAdmin,
  alumnosCtrl.eliminarAlumno,
);
router.get("/alumnos/:id/ficha", authMiddleware, alumnosCtrl.obtenerFicha);
router.put(
  "/alumnos/:id/ficha",
  authMiddleware,
  adminOInstructor,
  alumnosCtrl.actualizarFicha,
);
router.get("/alumnos/:id/feedback", authMiddleware, alumnosCtrl.listarFeedback);
router.post(
  "/alumnos/:id/feedback",
  authMiddleware,
  adminOInstructor,
  alumnosCtrl.agregarFeedback,
);

// Clases y sesiones
router.get("/clases", authMiddleware, clasesCtrl.horario);
router.post("/clases", authMiddleware, soloAdmin, clasesCtrl.crearClase);
router.put(
  "/clases/:grupoId",
  authMiddleware,
  soloAdmin,
  clasesCtrl.editarClase,
);
router.delete(
  "/clases/:grupoId",
  authMiddleware,
  soloAdmin,
  clasesCtrl.eliminarClase,
);
router.get("/sesiones", authMiddleware, clasesCtrl.sesionesDelDia);
router.get(
  "/sesiones/:sesionId/alumnos",
  authMiddleware,
  adminOInstructor,
  clasesCtrl.alumnosDeSesion,
);
router.post(
  "/sesiones/:sesionId/asistencia",
  authMiddleware,
  adminOInstructor,
  clasesCtrl.registrarAsistencia,
);
router.post(
  "/sesiones/:sesionId/suspender",
  authMiddleware,
  adminOInstructor,
  clasesCtrl.suspenderSesion,
);
router.get(
  "/reposiciones/pendientes",
  authMiddleware,
  adminOInstructor,
  clasesCtrl.listarReposicionesPendientes,
);
router.post(
  "/reposiciones/:reposicionId/usar",
  authMiddleware,
  adminOInstructor,
  clasesCtrl.usarReposicion,
);
<<<<<<< HEAD
=======

>>>>>>> develop
router.post(
  "/reposiciones/:reposicionId/revertir",
  authMiddleware,
  adminOInstructor,
  clasesCtrl.revertirReposicion,
);
// Reservaciones
router.post("/reservaciones", authMiddleware, reservacionesCtrl.crear);
router.delete("/reservaciones/:id", authMiddleware, reservacionesCtrl.cancelar);
router.get(
  "/reservaciones/mis-reservas",
  authMiddleware,
  reservacionesCtrl.misReservas,
);

// Inscripciones y paquetes
router.get(
  "/inscripciones",
  authMiddleware,
  soloAdmin,
  inscripcionesCtrl.listar,
);
router.post(
  "/inscripciones",
  authMiddleware,
  soloAdmin,
  inscripcionesCtrl.crear,
);
router.patch(
  "/inscripciones/:id/renovar",
  authMiddleware,
  soloAdmin,
  inscripcionesCtrl.renovar,
);
router.patch(
  "/inscripciones/:id/baja",
  authMiddleware,
  soloAdmin,
  inscripcionesCtrl.darDeBaja,
);
router.patch(
  "/inscripciones/:id/dia-pago",
  authMiddleware,
  soloAdmin,
  inscripcionesCtrl.actualizarDiaPago,
);
router.get("/paquetes", inscripcionesCtrl.listarPaquetes);
router.post(
  "/paquetes",
  authMiddleware,
  soloAdmin,
  inscripcionesCtrl.crearPaquete,
);
router.put(
  "/paquetes/:id",
  authMiddleware,
  soloAdmin,
  inscripcionesCtrl.editarPaquete,
);
router.delete(
  "/paquetes/:id",
  authMiddleware,
  soloAdmin,
  inscripcionesCtrl.eliminarPaquete,
);

// Pagos
router.get("/pagos", authMiddleware, soloAdmin, pagosCtrl.listar);
router.post("/pagos", authMiddleware, soloAdmin, pagosCtrl.registrar);
router.get(
  "/pagos/pendientes",
  authMiddleware,
  soloAdmin,
  pagosCtrl.pendientes,
);
router.get("/pagos/mis-pagos", authMiddleware, pagosCtrl.misPagos);
router.patch(
  "/pagos/:id",
  authMiddleware,
  soloAdmin,
  pagosCtrl.actualizarEstado,
);
router.put("/pagos/:id", authMiddleware, soloAdmin, pagosCtrl.editarPago);
router.delete("/pagos/:id", authMiddleware, soloAdmin, pagosCtrl.eliminarPago);
router.post(
  "/pagos/:id/comprobante",
  authMiddleware,
  upload.single("comprobante"),
  pagosCtrl.subirComprobante,
);

// Gastos
router.get("/gastos", authMiddleware, soloAdmin, gastosCtrl.listar);
router.post("/gastos", authMiddleware, soloAdmin, gastosCtrl.crear);
router.delete("/gastos/:id", authMiddleware, soloAdmin, gastosCtrl.eliminar);
router.get(
  "/gastos/resumen-financiero",
  authMiddleware,
  soloAdmin,
  gastosCtrl.resumenFinanciero,
);

module.exports = router;
