// Comandos de control. 


const readline = require('readline');
// Importacion del módulo out.js
//const logerror = require("./out");
//const biglog = require("./out");
//const log = require("./out");
//const colorize = require("./out");
const {log, biglog, errorlog, colorize} = require('./out');


const model = require('./model');

/**
 * Muestra la ayuda.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.helpCmd = rl => {
	log("Comandos:");
	log(" h|help - Muestra esta ayuda.");
	log(" list - Lista los quizzes existentes.");
	log(" show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
	log(" add - Añadir un nuevo quiz interactivamente.");
	log(" delete <id> - Borra el quiz indicado.");
	log(" edit <id> - Edita el quiz indicado.");
	log(" test <id> - Prueba el quiz indicado.");
	log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
	log(" credits - Créditos.");
	log("q|quit - Salir del programa."); 
	rl.prompt();
};

/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */

exports.listCmd = rl => {
	model.getAll().forEach((quiz,id) => {
		log(`	'[${colorize(id, 'magenta')}]': ${quiz.question} `);
		});
	rl.prompt();
};

/**
 * Muestra el quiz indicado en el parámetro: la pregunta y
 *  la respuesta.
 *
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl, id) => {
	//log('Mostrar e quiz indicado.','red');
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
	} else {
		try {
			const quiz = model.getByIndex(id);
			log(`	[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer} `);					
		} catch(error) {
			errorlog(error.message);
		}	
	}

	rl.prompt();
};

/**
 * Añade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 */
exports.addCmd = rl => {
	//log('Añadir un nuevo quiz.','red');
	rl.question(colorize( ' Introduzca una pregunta: ', 'red'), question => {
		rl.question(colorize( ' Introduzca la respuesta: ', 'red'), answer => {
			model.add(question, answer);
			log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>','magenta')} ${answer}`);
			rl.prompt();		
		});
	});
};

/**
 * Borra un quiz del modelo.
 *
 * @param id Clave del quiz a borrar en el modelo.
 */
exports.deleteCmd = (rl,id) => {
	//log('Borrar el quiz indicado.','red');
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
	} else {
		try {
			model.deleteByIndex(id);
		} catch(error) {
			errorlog(error.message);
		}	
	}

	rl.prompt();
};

/**
 * Edita un quiz del modelo
 *
 * @param id Clave del quiz a editar en el modelo.
 */
exports.editCmd = (rl,id) => {
	//log('Editar el quiz indicado.','red');
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} else {
		try{
			const quiz = model.getByIndex(id);

			process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question)},0);
			rl.question(colorize( ' Introduzca una pregunta: ', 'red'), question => {
				process.stdout.isTTY && setTimeout(() => { rl.write(quiz.answer)},0);
				rl.question(colorize( ' Introduzca la respuesta: ', 'red'), answer => {
					model.update(id, question, answer);
					log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>','magenta')} ${answer}`);
					rl.prompt();		
				});
			});
		} catch (error) {
			errorlog(error.message);
			rl.prompt();
		}
	}

};

/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la
 *  que debemos contestar.
 *
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl,id) => {
	//log('Probar el quiz indicado.','red');
	if (typeof id === "undefined") {
		errorlog(`Falta el parámetro id.`);
		rl.prompt();
	} else {
		try {
			const quiz = model.getByIndex(id);

			rl.question(quiz.question, answer => {
				if (answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
					log('Su respuesta es correcta.', 'green');
					biglog('CORRECTO', 'green');
				} else {
					log('Su respuesta es incorrecta.', 'green');
					biglog('Incorrecta', 'red');
				}
				rl.prompt();
			});
		} catch(error) {
				errorlog(error.message);
				rl.prompt();
		}
	}
	
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden
 *  aleatroio.
 * Se gana si se contesta a todos satisfactoriamente.
 */
exports.playCmd = rl => {
	//log('Jugar.','red');
	
	let score = 0;

    let toBeResolved = [];
    //let preguntas = [];
	for (var i = 0; i < model.getAll().length; i++) {
		toBeResolved[i] = i;
	}
     	 
    const random = (min,max) => {
     	return Math.random() * (max-min) + min;
    };	
 		
    const playOne = () => {
    	if (toBeResolved.length==0) {
     		log(`No hay nada más que preguntar. Fin del juego.`);
     		log('Tu puntuación es: ' );
     		biglog(score, 'green');
     		rl.prompt();
		}else	{
     	 	let id = Math.floor(random(0, toBeResolved.length));

     	 	let posicion = toBeResolved[id];
     	 	toBeResolved.splice(id,1);

     	 	const quiz = model.getByIndex(posicion);
     	 	rl.question(quiz.question, answer => {
     	 	//const sinEspacios = respuesta.match(/[a-zñáéíóúA-Z0-9_]+/ig);
     	 		if(answer.trim().toLowerCase() == quiz.answer.trim().toLowerCase()) {
     	 			score = score+1;
     	 			log(`CORRECTO - Lleva ${score} aciertos.`);
     	 			playOne();
     	 		} else {
     	 			log('INCORRECTO.','red');
     	 			log(`Fin del juego. Aciertos: ${score}`);
     	 			biglog(score, 'green');
     	 			rl.prompt();
     	 		}
     	 	});
     	}
    };
     	 
playOne();
};

/**
 * Muestra los nombres de los autores de la práctica.
 */
exports.creditsCmd = rl =>{
	log('Autor de la práctica.');
	log('Iñaki de las Heras Pinto.','green');
	rl.prompt();
};

/**
 * Terminar el programa.
 */
exports.quitCmd = rl =>{
	rl.close();
};
