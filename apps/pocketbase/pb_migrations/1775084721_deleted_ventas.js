/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_ventas00000");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select643686883",
        "maxSelect": 1,
        "name": "estado",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "pendiente",
          "completada",
          "cancelada"
        ]
      }
    ],
    "id": "pbc_ventas00000",
    "indexes": [],
    "listRule": "",
    "name": "ventas",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
})
