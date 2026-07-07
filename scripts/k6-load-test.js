import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba de carga
export const options = {
    stages: [
        { duration: '30s', target: 20 },  // Ramp-up: 20 usuarios concurrentes en 30 segundos
        { duration: '1m', target: 20 },   // Mantener 20 usuarios por 1 minuto
        { duration: '30s', target: 0 },   // Ramp-down: Bajar a 0 usuarios
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // El 95% de las peticiones deben tardar menos de 500ms
        http_req_failed: ['rate<0.01'],   // Menos del 1% de errores
    },
};

const API_URL = __ENV.API_URL || 'http://localhost:4001';
// Token de autenticación de prueba (Generar usando la UI o un script de prueba)
const TOKEN = __ENV.BEARER_TOKEN || 'TU_TOKEN_AQUI';

export default function () {
    const params = {
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
        },
    };

    // Escenario 1: Gerente abriendo el Dashboard principal (Listado de Proyectos)
    const projectsRes = http.get(`${API_URL}/projects`, params);
    
    check(projectsRes, {
        'status is 200 (projects)': (r) => r.status === 200,
        'response time < 500ms (projects)': (r) => r.timings.duration < 500,
    });

    // Simulamos un breve tiempo de lectura en la UI (think time)
    sleep(1);

    // Escenario 2: Gerente abriendo la vista de Personal (RRHH)
    const employeesRes = http.get(`${API_URL}/rrhh/employees?limit=50`, params);
    
    check(employeesRes, {
        'status is 200 (employees)': (r) => r.status === 200,
        'response time < 500ms (employees)': (r) => r.timings.duration < 500,
    });

    sleep(2);
}
