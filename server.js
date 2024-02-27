const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = 3000;

let orderedMeals = [];
let orderId = 0;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.post('/selected-meal', (req, res) => {
  const selectedMeal = req.body.meal;
  const customMeal = req.body.customMeal;
  const tableNumber = req.body.tableNumber;

  const mealName = customMeal ? customMeal : selectedMeal;

  orderedMeals.push({ id: orderId++, name: mealName, status: 'Awaiting preparation', tableNumber });

  res.json({ id: orderId - 1 });
});

app.post('/update-status', (req, res) => {
  const orderIdToUpdate = parseInt(req.body.id);
  const status = req.body.status;

  for (const meal of orderedMeals) {
    if (meal.id === orderIdToUpdate) {
      meal.status = status;
      break;
    }
  }

  res.json({ success: true });
});

app.post('/confirm-order', (req, res) => {
  const orderIdToConfirm = parseInt(req.body.id);

  orderedMeals = orderedMeals.filter(meal => meal.id !== orderIdToConfirm);

  res.json({ success: true });
});

app.get('/ordered-meals', (req, res) => {
  res.json(orderedMeals);
});

const wss = new WebSocket.Server({ server: app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}. Kitchen side can be connected by going to http://localhost:${PORT}/receiver.html`);
})});

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});
