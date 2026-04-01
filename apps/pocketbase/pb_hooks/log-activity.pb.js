/// <reference path="../pb_data/types.d.ts" />
// Log activity when clientes records are created
onRecordAfterCreateSuccess((e) => {
  const activity = new Record($app.findCollectionByNameOrId("actividades"));
  activity.set("usuario_id", e.record.get("usuario_id"));
  activity.set("tipo", "creacion_cliente");
  activity.set("descripcion", "Cliente creado: " + e.record.get("nombre"));
  activity.set("entidad_id", e.record.id);
  activity.set("entidad_tipo", "cliente");
  activity.set("fecha", new Date().toISOString().split('T')[0]);
  $app.save(activity);
  e.next();
}, "clientes");

// Log activity when clientes records are updated
onRecordAfterUpdateSuccess((e) => {
  const activity = new Record($app.findCollectionByNameOrId("actividades"));
  activity.set("usuario_id", e.record.get("usuario_id"));
  activity.set("tipo", "edicion_cliente");
  activity.set("descripcion", "Cliente editado: " + e.record.get("nombre"));
  activity.set("entidad_id", e.record.id);
  activity.set("entidad_tipo", "cliente");
  activity.set("fecha", new Date().toISOString().split('T')[0]);
  $app.save(activity);
  e.next();
}, "clientes");

// Log activity when clientes records are deleted
onRecordAfterDeleteSuccess((e) => {
  const activity = new Record($app.findCollectionByNameOrId("actividades"));
  activity.set("usuario_id", e.record.get("usuario_id"));
  activity.set("tipo", "eliminacion_cliente");
  activity.set("descripcion", "Cliente eliminado: " + e.record.get("nombre"));
  activity.set("entidad_id", e.record.id);
  activity.set("entidad_tipo", "cliente");
  activity.set("fecha", new Date().toISOString().split('T')[0]);
  $app.save(activity);
  e.next();
}, "clientes");

// Log activity when tareas records are created
onRecordAfterCreateSuccess((e) => {
  const activity = new Record($app.findCollectionByNameOrId("actividades"));
  activity.set("usuario_id", e.record.get("usuario_id"));
  activity.set("tipo", "cambio_tarea");
  activity.set("descripcion", "Tarea creada: " + e.record.get("titulo"));
  activity.set("entidad_id", e.record.id);
  activity.set("entidad_tipo", "tarea");
  activity.set("fecha", new Date().toISOString().split('T')[0]);
  $app.save(activity);
  e.next();
}, "tareas");

// Log activity when tareas records are updated
onRecordAfterUpdateSuccess((e) => {
  const activity = new Record($app.findCollectionByNameOrId("actividades"));
  activity.set("usuario_id", e.record.get("usuario_id"));
  activity.set("tipo", "cambio_tarea");
  activity.set("descripcion", "Tarea actualizada: " + e.record.get("titulo"));
  activity.set("entidad_id", e.record.id);
  activity.set("entidad_tipo", "tarea");
  activity.set("fecha", new Date().toISOString().split('T')[0]);
  $app.save(activity);
  e.next();
}, "tareas");

// Log activity when seguimientos records are created
onRecordAfterCreateSuccess((e) => {
  const activity = new Record($app.findCollectionByNameOrId("actividades"));
  activity.set("usuario_id", e.record.get("usuario_id"));
  activity.set("tipo", "nuevo_seguimiento");
  activity.set("descripcion", "Nuevo seguimiento: " + e.record.get("tipo"));
  activity.set("entidad_id", e.record.id);
  activity.set("entidad_tipo", "seguimiento");
  activity.set("fecha", new Date().toISOString().split('T')[0]);
  $app.save(activity);
  e.next();
}, "seguimientos");