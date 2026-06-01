/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const fechaVencimiento = e.record.get("fecha_vencimiento");
  const usuarioId = e.record.get("usuario_id");
  const tareaId = e.record.id;
  
  if (!fechaVencimiento || !usuarioId) {
    e.next();
    return;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  
  const dueDate = new Date(fechaVencimiento);
  dueDate.setHours(0, 0, 0, 0);
  
  let tipo = null;
  
  if (dueDate < today) {
    tipo = "vencida";
  } else if (dueDate.getTime() === today.getTime()) {
    tipo = "proxima_hoy";
  } else if (dueDate.getTime() === tomorrow.getTime()) {
    tipo = "proxima_manana";
  } else if (dueDate <= threeDaysLater) {
    tipo = "proxima_3dias";
  }
  
  if (tipo) {
    try {
      const existingNotif = $app.findFirstRecordByFilter("notificaciones", "tarea_id = {:tarea_id} && usuario_id = {:usuario_id}", { "tarea_id": tareaId, "usuario_id": usuarioId });
      if (existingNotif) {
        e.next();
        return;
      }
    } catch (err) {
      // No existing notification found, continue
    }
    
    const notif = new Record("notificaciones", {
      usuario_id: usuarioId,
      tarea_id: tareaId,
      tipo: tipo,
      leida: false
    });
    
    $app.save(notif);
  }
  
  e.next();
}, "tareas");

onRecordAfterUpdateSuccess((e) => {
  const fechaVencimiento = e.record.get("fecha_vencimiento");
  const usuarioId = e.record.get("usuario_id");
  const tareaId = e.record.id;
  
  if (!fechaVencimiento || !usuarioId) {
    e.next();
    return;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  
  const dueDate = new Date(fechaVencimiento);
  dueDate.setHours(0, 0, 0, 0);
  
  let tipo = null;
  
  if (dueDate < today) {
    tipo = "vencida";
  } else if (dueDate.getTime() === today.getTime()) {
    tipo = "proxima_hoy";
  } else if (dueDate.getTime() === tomorrow.getTime()) {
    tipo = "proxima_manana";
  } else if (dueDate <= threeDaysLater) {
    tipo = "proxima_3dias";
  }
  
  if (tipo) {
    try {
      const existingNotif = $app.findFirstRecordByFilter("notificaciones", "tarea_id = {:tarea_id} && usuario_id = {:usuario_id}", { "tarea_id": tareaId, "usuario_id": usuarioId });
      if (existingNotif) {
        e.next();
        return;
      }
    } catch (err) {
      // No existing notification found, continue
    }
    
    const notif = new Record("notificaciones", {
      usuario_id: usuarioId,
      tarea_id: tareaId,
      tipo: tipo,
      leida: false
    });
    
    $app.save(notif);
  }
  
  e.next();
}, "tareas");