// features/user/components/GestionUsuario.tsx

import { useState, useEffect, type ReactElement, useRef } from "react";
import { FaUserPlus, FaFileExcel, FaFileExport, FaEdit, FaUserCog } from "react-icons/fa";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { Usuario, Rol } from "../interfaces/usuarios"; 
import { crearUsuario, getRoles, getUsuariosTodos, updateUsuario, obtenerPerfil, deleteUsuario, reactivarUsuario, exportarUsuariosExcel, cargarUsuariosExcel } from "../../auth/api/auth";
import Modal from "../../../components/Modal";
import UserForm from "./UserForm";

export default function GestionUsuarios(): ReactElement {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [allUsuarios, setAllUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<Partial<Usuario & { rolId?: number }>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isPermOpen, setIsPermOpen] = useState(false);
  const [permUser, setPermUser] = useState<Partial<Usuario> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const applyFilter = (usersToFilter: Usuario[]) => {
    let filtered = usersToFilter;
    if (searchTerm.trim() !== '') {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        const nombreCompleto = `${user.nombre} ${user.apellidos || ''}`.toLowerCase();
        const identificacion = String(user.identificacion).toLowerCase();
        const rol = user.tipoUsuario?.nombre.toLowerCase() || '';
        return nombreCompleto.includes(lowercasedTerm) || identificacion.includes(lowercasedTerm) || rol.includes(lowercasedTerm);
      });
    }
    if (filterStatus === 'active') {
      filtered = filtered.filter(user => user.estado);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(user => !user.estado);
    }
    setUsuarios(filtered);
  };

  const fetchData = async () => {
    try {
      const [perfilData, usuariosData, rolesData] = await Promise.all([obtenerPerfil(), getUsuariosTodos(), getRoles()]);
      const loggedInUserIdentificacion = perfilData?.identificacion;
      
      let allUsers: Usuario[] = (usuariosData?.data && Array.isArray(usuariosData.data)) ? usuariosData.data : (Array.isArray(usuariosData) ? usuariosData : []);
      
      const filteredUsers = allUsers.filter(user => {
        const isNotAdmin = user.tipoUsuario?.nombre.toLowerCase() !== 'admin';
        const isNotLoggedInUser = loggedInUserIdentificacion ? String(user.identificacion) !== String(loggedInUserIdentificacion) : true;
        return isNotAdmin && isNotLoggedInUser;
      });

      setAllUsuarios(filteredUsers);
      applyFilter(filteredUsers);

      const rolesList: Rol[] = (rolesData?.data && Array.isArray(rolesData.data)) ? rolesData.data : (Array.isArray(rolesData) ? rolesData : []);
      setRoles(rolesList.filter((rol: Rol) => rol.nombre.toLowerCase() !== 'admin'));
    } catch (error: unknown) {
      console.error("Error cargando datos:", error);
      const errorMessage = (error as any).response?.data?.message || "Error al cargar datos.";
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    const delayDebounceFn = setTimeout(() => {
      applyFilter(allUsuarios);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, allUsuarios, filterStatus]);

  const openModal = () => {
    setEditingId(null);
    setFormInitialData({});
    setIsModalOpen(true);
  };

  const openEditModal = (usuario: Usuario) => {
    setEditingId(usuario.id);
    setFormInitialData({
      identificacion: usuario.identificacion,
      nombre: usuario.nombre,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      telefono: usuario.telefono,
      rolId: usuario.tipoUsuario?.id,
      tipo: usuario.tipo,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSave = async (formData: any) => {
    const dataPayload = {
      Tipo_Identificacion: formData.tipo ?? "CC",
      identificacion: Number(formData.identificacion),
      nombre: formData.nombre,
      apellidos: formData.apellidos,
      correo: formData.correo,
      telefono: formData.telefono,
      tipoUsuario: formData.rolId,
    };
    const toastId = toast.loading(editingId != null ? 'Actualizando usuario...' : 'Creando usuario...');
    try {
      if (editingId != null) {
        await updateUsuario(editingId, dataPayload);
      } else {
        await crearUsuario({ ...dataPayload, password: String(formData.identificacion) });
      }
      toast.success(editingId != null ? 'Usuario actualizado con éxito' : 'Usuario creado con éxito', { id: toastId });
      await fetchData();
      closeModal();
    } catch (error: unknown) {
      console.error("Error guardando usuario:", error);
      const apiErrors = (error as any).response?.data?.message;
      let errorMessage = editingId != null ? 'Error al actualizar.' : 'Error al crear.';
      if (Array.isArray(apiErrors)) { errorMessage = apiErrors.join('. '); } 
      else if (typeof apiErrors === 'string') { errorMessage = apiErrors; }
      toast.error(errorMessage, { id: toastId });
    }
  };

  const handleToggleActive = async (usuario: Usuario) => {
    const toastId = toast.loading(usuario.estado ? "Desactivando..." : "Activando...");
    try {
      if (usuario.estado) {
        await deleteUsuario(usuario.id);
      } else {
        await reactivarUsuario(usuario.id);
      }
      toast.success(usuario.estado ? "Usuario desactivado" : "Usuario activado", { id: toastId });
      await fetchData();
    } catch (error: unknown) {
      console.error("Error cambiando estado:", error);
      const errorMessage = (error as any).response?.data?.message || "Error al cambiar estado.";
      toast.error(errorMessage, { id: toastId });
    }
  };
  
  const handleExportExcel = async () => {
    const toastId = toast.loading("Exportando a Excel...");
    try {
      const blob = await exportarUsuariosExcel();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'usuarios.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Usuarios exportados.", { id: toastId });
    } catch (error) {
      console.error("Error al exportar:", error);
      toast.error("No se pudo exportar.", { id: toastId });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Por favor, seleccione un archivo Excel.");
      return;
    }
    const toastId = toast.loading("Cargando desde Excel...");
    try {
      const resultado = await cargarUsuariosExcel(file);
      const { creados = 0, errores = [] } = resultado.data || {};
      const successMessage = `Carga completada. Creados: ${creados}. Errores: ${errores.length}.`;
      if (errores.length > 0) {
        console.error("Errores en carga Excel:", errores);
        toast.warning(<div><p>{successMessage}</p><p className="text-xs mt-1">Revise la consola para ver los errores.</p></div>, { id: toastId });
      } else {
        toast.success(successMessage, { id: toastId });
      }
      await fetchData();
    } catch (error: unknown) {
      console.error("Error al cargar Excel:", error);
      const errorMessage = (error as any).response?.data?.message || "Error al procesar el archivo.";
      toast.error(errorMessage, { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsuarios = usuarios.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(usuarios.length / itemsPerPage);

  return (
    <div className="bg-white shadow-xl rounded-xl p-6 w-full flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-700">Gestión de Usuarios</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm text-sm transition"><FaUserPlus /> Nuevo Usuario</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm text-sm transition"><FaFileExcel /> Cargar Excel</button>
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 shadow-sm text-sm transition"><FaFileExport /> Exportar</button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <input type="text" placeholder="Buscar por nombre, ID o rol..." className="border border-gray-300 rounded-lg px-4 py-2 w-72 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <div className="overflow-auto flex-grow min-h-0">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left">Identificación</th>
              <th className="px-4 py-3 text-left">Nombres y Apellidos</th>
              <th className="px-4 py-3 text-left">Correo</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-center">
                <div className="relative inline-block text-left">
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                    className="appearance-none cursor-pointer w-full bg-gray-200 border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-gray-300 focus:border-gray-400 text-xs font-medium"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z"/></svg>
                  </div>
                </div>
              </th>
              <th className="px-4 py-3 text-center">Acciones</th>
              <th className="px-4 py-3 text-center">Permisos</th>
            </tr>
          </thead>
          <tbody>
            {currentUsuarios.map((usuario) => (
              <tr key={usuario.id} className="border-t hover:bg-blue-50 transition">
                <td className="px-4 py-3">{usuario.identificacion}</td>
                <td className="px-4 py-3 font-medium text-gray-700">{usuario.nombre} {usuario.apellidos}</td>
                <td className="px-4 py-3 text-gray-600">{usuario.correo}</td>
                <td className="px-4 py-3">{`+57 ${String(usuario.telefono).slice(0, 3)} ${String(usuario.telefono).slice(3, 6)} ${String(usuario.telefono).slice(6)}`}</td>
                <td className="px-4 py-3 text-gray-700">{usuario.tipoUsuario?.nombre || 'No asignado'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${usuario.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {usuario.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-3">
                  <button onClick={() => openEditModal(usuario)} className="text-blue-600 hover:text-blue-800 transition"><FaEdit /></button>
                  <label className="flex items-center cursor-pointer"><div className="relative"><input type="checkbox" className="sr-only" checked={usuario.estado} onChange={() => handleToggleActive(usuario)} /><div className={`block w-10 h-6 rounded-full ${usuario.estado ? 'bg-green-400' : 'bg-gray-300'}`}></div><div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${usuario.estado ? 'transform translate-x-full' : ''}`}></div></div></label>
                </td>
                <td className="px-4 py-3 text-center"><button onClick={() => { setPermUser(usuario); setIsPermOpen(true); }} className="text-gray-700 hover:text-black transition"><FaUserCog /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4 text-sm text-gray-600 flex-shrink-0">
        <span>Mostrando {Math.min(currentUsuarios.length, itemsPerPage)} de {usuarios.length} usuarios</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg disabled:opacity-50"><ChevronLeft size={16}/></button>
            <span className="font-medium">Página {currentPage} de {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg disabled:opacity-50"><ChevronRight size={16}/></button>
          </div>
        )}
      </div>
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? 'Actualizar Usuario' : 'Información de Registro'}><UserForm initialData={formInitialData} roles={roles} onSave={handleSave} onCancel={closeModal} editingId={editingId} /></Modal>
      {isPermOpen && permUser && ( <div /> )}
    </div>
  );
}
