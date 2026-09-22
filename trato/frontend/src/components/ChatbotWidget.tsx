'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';

interface Mensaje {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface Accion {
  tipo: string;
  texto: string;
  accion?: string;
  campo?: string;
}

export function ChatbotWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      role: 'assistant',
      content:
        '👋 ¡Hola! Soy IVI Assistant. Estoy aquí para ayudarte con preguntas sobre tratamientos de fertilidad. ¿Qué necesitas saber?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Auto-scroll a último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // Cargar sesión guardada
  useEffect(() => {
    const sesionGuardada = localStorage.getItem('chatbot_session');
    const emailGuardado = localStorage.getItem('chatbot_email');
    const nombreGuardado = localStorage.getItem('chatbot_nombre');
    const edadGuardada = localStorage.getItem('chatbot_edad');

    if (sesionGuardada) {
      setSessionId(sesionGuardada);
      setMostrarFormulario(false);
    }
    if (emailGuardado) setEmail(emailGuardado);
    if (nombreGuardado) setNombre(nombreGuardado);
    if (edadGuardada) setEdad(edadGuardada);
  }, []);

  // Guardar sesión en localStorage
  const guardarSesion = (id: string, e: string, n: string, ed: string) => {
    localStorage.setItem('chatbot_session', id);
    localStorage.setItem('chatbot_email', e);
    localStorage.setItem('chatbot_nombre', n);
    localStorage.setItem('chatbot_edad', ed);
  };

  const enviarMensaje = async () => {
    if (!input.trim()) return;

    // Si no completó formulario, validar email
    if (mostrarFormulario && !email) {
      alert('Por favor ingresa tu email para continuar');
      return;
    }

    const usuarioMensaje = input;
    setInput('');
    setMensajes((prev) => [
      ...prev,
      { role: 'user', content: usuarioMensaje },
    ]);
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/v1/chat/mensaje`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          email,
          mensaje: usuarioMensaje,
          contexto: {
            nombre,
            edad: edad ? parseInt(edad) : undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error en respuesta del servidor');
      }

      const data = await response.json();

      // Guardar session si es nueva
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
        guardarSesion(data.sessionId, email, nombre, edad);
        setMostrarFormulario(false);
      }

      setMensajes((prev) => [
        ...prev,
        { role: 'assistant', content: data.respuesta },
      ]);

      // Mostrar acciones sugeridas si existen
      if (data.acciones_sugeridas && data.acciones_sugeridas.length > 0) {
        const accionesTexto = data.acciones_sugeridas
          .map((a: Accion) => a.texto)
          .join(' • ');
        setMensajes((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `💡 Sugerencias: ${accionesTexto}`,
          },
        ]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMensajes((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '❌ Disculpa, hubo un error. Intenta de nuevo o contacta directamente al (+56) 2 2571 3601',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all z-40 animate-pulse"
        aria-label="Abrir chat"
        title="¿Preguntas? Pregúntale a IVI Assistant"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex justify-between items-center rounded-t-2xl">
        <div>
          <h3 className="font-bold text-lg">IVI Assistant</h3>
          <p className="text-sm text-blue-100">Responde en tiempo real</p>
        </div>
        <button
          onClick={() => setAbierto(false)}
          className="hover:bg-blue-700 p-1 rounded transition"
          aria-label="Cerrar chat"
        >
          <X size={24} />
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {mensajes.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg break-words ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-900 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">IVI está escribiendo...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de datos (si es nuevo usuario) */}
      {mostrarFormulario && (
        <div className="bg-blue-50 border-t border-blue-200 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            Para ayudarte mejor:
          </p>
          <input
            type="email"
            placeholder="Tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Nombre (opcional)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <input
            type="number"
            placeholder="Edad (opcional)"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            disabled={loading}
            min="18"
            max="50"
          />
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4 flex gap-2 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            mostrarFormulario
              ? 'Hola, ¿qué necesitas?'
              : 'Escribe tu pregunta...'
          }
          disabled={loading}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
        />
        <button
          onClick={enviarMensaje}
          disabled={loading || !input.trim()}
          className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          aria-label="Enviar mensaje"
        >
          <Send size={20} />
        </button>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600 text-center border-t">
        ☎️ O llama: (+56) 2 2571 3601
      </div>
    </div>
  );
}
