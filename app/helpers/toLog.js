'use strict';
const fs = require('fs');
// Funcion que envia esta linea al log, si esta activo

module.exports.toLog = (line) => {
  line = line + '\n';
  if (CONFIG.use_log) {
    console.log(line);
    fs.appendFile(CONFIG.log_file, line, (err) => {
      if (err) {
        console.log(err, 'error agregando al archivo de log');
      }
    });
  }
};