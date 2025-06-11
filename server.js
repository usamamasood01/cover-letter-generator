const app = require("./app");

const PORT = process.env.PORT || 5050;

console.log(`Attempting to listen on port ${PORT}`);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
