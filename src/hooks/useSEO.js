import { useEffect } from 'react';

/**
 * Hook personalizado para actualizar dinámicamente el título y descripción del sitio.
 * 
 * @param {Object} params
 * @param {string} params.title - El título específico de la pestaña/página actual.
 * @param {string} params.description - La descripción SEO específica para la vista.
 */
export function useSEO({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} | GANANCY` : 'GANANCY - Planificación Contable y CFO Inteligente';
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description || 'Planificación contable avanzada, automatización de flujos de caja y CFO inteligente para optimizar tus finanzas.');
  }, [title, description]);
}

export default useSEO;
