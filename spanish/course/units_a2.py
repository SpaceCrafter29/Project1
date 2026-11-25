# Kursinhalte Teil 2: A2 und Einstieg B1 (Einheiten u13–u25)

UNITS_A2 = [
    dict(
        id="u13", level="A2", title="Arbeit und Studium",
        goal="Du kannst über deinen Beruf, dein Studium und deinen Arbeitsalltag sprechen.",
        grammar="""**Beruf mit ser, ohne Artikel:** *Soy ingeniero.* (nicht: *Soy un ingeniero*). Mit Adjektiv steht der Artikel: *Es un médico muy bueno.*

**trabajar de / como** = arbeiten als: *Trabajo de camarero.*
**trabajar en** = arbeiten bei / in: *Trabajo en una empresa de software.*

**Unregelmäßige yo-Formen** (die anderen Formen sind regelmäßig):
• *hacer* → **hago** (machen)
• *salir* → **salgo** (ausgehen)
• *saber* → **sé** (wissen)
• *conocer* → **conozco** (kennen)
• *poner* → **pongo** (legen / stellen)

**desde hace** = seit (Zeitraum): *Trabajo aquí desde hace tres años.*""",
        vocab=[
            ("el trabajo", "die Arbeit / der Job"), ("la empresa", "die Firma"), ("la oficina", "das Büro"),
            ("el jefe", "der Chef"), ("la jefa", "die Chefin"), ("el compañero de trabajo", "der Kollege"),
            ("el sueldo", "das Gehalt"), ("la reunión", "die Besprechung"), ("el ingeniero", "der Ingenieur"),
            ("el médico", "der Arzt"), ("el profesor", "der Lehrer"), ("estudiar", "studieren / lernen"),
            ("la universidad", "die Universität"), ("teletrabajar", "im Homeoffice arbeiten"),
            ("estresante", "stressig"), ("el horario", "die Arbeitszeit / der Zeitplan"),
        ],
        phrases=[
            ("¿A qué te dedicas?", "Was machst du beruflich?"),
            ("Soy ingeniero de software.", "Ich bin Softwareingenieur."),
            ("Trabajo en una empresa pequeña.", "Ich arbeite in einer kleinen Firma."),
            ("Trabajo aquí desde hace tres años.", "Ich arbeite seit drei Jahren hier."),
            ("Dos días a la semana teletrabajo.", "Zwei Tage pro Woche arbeite ich im Homeoffice."),
            ("Mi trabajo es interesante, pero estresante.", "Meine Arbeit ist interessant, aber stressig."),
            ("Estudio economía en la universidad.", "Ich studiere Wirtschaft an der Uni."),
            ("Tengo una reunión a las diez.", "Ich habe um zehn eine Besprechung."),
        ],
        dialogue=[
            ("A", "¿Y tú a qué te dedicas?", "Und was machst du beruflich?"),
            ("B", "Soy diseñadora gráfica. Trabajo en una agencia.", "Ich bin Grafikdesignerin. Ich arbeite in einer Agentur."),
            ("A", "¡Qué interesante! ¿Te gusta?", "Wie interessant! Gefällt es dir?"),
            ("B", "Sí, mucho, aunque a veces trabajo demasiado. ¿Y tú?", "Ja, sehr, obwohl ich manchmal zu viel arbeite. Und du?"),
            ("A", "Yo soy programador. Trabajo desde casa casi siempre.", "Ich bin Programmierer. Ich arbeite fast immer von zu Hause."),
            ("B", "¡Qué suerte! ¿Y no te sientes solo?", "Was für ein Glück! Und fühlst du dich nicht allein?"),
            ("A", "Un poco, por eso voy a un coworking los viernes.", "Ein bisschen, deshalb gehe ich freitags in einen Coworking-Space."),
        ],
        roleplay="Du hast ein kurzes Vorstellungsgespräch auf Spanisch. Die KI ist die Personalerin und fragt nach deinem Beruf, deiner Erfahrung und deinen Stärken.",
    ),
    dict(
        id="u14", level="A2", title="Reisen und Hotel",
        goal="Du kannst ein Hotelzimmer buchen, einchecken und Probleme melden.",
        grammar="""**Höfliche Bitten mit dem Imperfekt / Konditional**
• *Quería reservar una habitación.* = Ich wollte / würde gern ein Zimmer reservieren.
• *¿Podría…?* = Könnten Sie …? *¿Podría darme la llave?*
• *Me gustaría…* = Ich hätte gern / würde gern …

**Direkte Objektpronomen:** lo (ihn / es), la (sie), los, las
• *¿La habitación? La reservé ayer.* = Das Zimmer? Ich habe es gestern reserviert.
• Sie stehen vor dem konjugierten Verb oder hängen am Infinitiv: *Quiero reservarla.*

**Zeitangaben:** *para dos noches* (für zwei Nächte), *del 3 al 5 de mayo* (vom 3. bis 5. Mai).""",
        vocab=[
            ("el hotel", "das Hotel"), ("la reserva", "die Reservierung"), ("reservar", "reservieren / buchen"),
            ("la habitación doble", "das Doppelzimmer"), ("la habitación individual", "das Einzelzimmer"),
            ("el desayuno incluido", "Frühstück inklusive"), ("la recepción", "die Rezeption"), ("el pasaporte", "der Reisepass"),
            ("la maleta", "der Koffer"), ("el aire acondicionado", "die Klimaanlage"), ("la toalla", "das Handtuch"),
            ("el vuelo", "der Flug"), ("el aeropuerto", "der Flughafen"), ("el billete", "die Fahrkarte / das Ticket"),
            ("de ida y vuelta", "hin und zurück"), ("no funciona", "funktioniert nicht"),
        ],
        phrases=[
            ("Quería reservar una habitación doble.", "Ich würde gern ein Doppelzimmer reservieren."),
            ("Para dos noches, del tres al cinco de mayo.", "Für zwei Nächte, vom dritten bis fünften Mai."),
            ("¿El desayuno está incluido?", "Ist das Frühstück inklusive?"),
            ("Tengo una reserva a nombre de Müller.", "Ich habe eine Reservierung auf den Namen Müller."),
            ("El aire acondicionado no funciona.", "Die Klimaanlage funktioniert nicht."),
            ("¿Podría darme otra toalla?", "Könnten Sie mir noch ein Handtuch geben?"),
            ("¿A qué hora hay que dejar la habitación?", "Um wie viel Uhr muss man das Zimmer verlassen?"),
            ("Un billete de ida y vuelta a Toledo, por favor.", "Eine Fahrkarte hin und zurück nach Toledo, bitte."),
        ],
        dialogue=[
            ("A", "Buenas tardes. Tengo una reserva a nombre de Weber.", "Guten Tag. Ich habe eine Reservierung auf den Namen Weber."),
            ("B", "Un momento… Sí, una habitación doble para tres noches.", "Einen Moment … Ja, ein Doppelzimmer für drei Nächte."),
            ("A", "Exacto. ¿El desayuno está incluido?", "Genau. Ist das Frühstück inklusive?"),
            ("B", "Sí, es de siete a diez y media en la primera planta.", "Ja, von sieben bis halb elf im ersten Stock."),
            ("A", "Perfecto. ¿Hay wifi en la habitación?", "Perfekt. Gibt es WLAN im Zimmer?"),
            ("B", "Sí, la contraseña está en la tarjeta. Aquí tiene su llave.", "Ja, das Passwort steht auf der Karte. Hier ist Ihr Schlüssel."),
            ("A", "Muchas gracias.", "Vielen Dank."),
        ],
        roleplay="Du checkst in einem Hotel in Granada ein. Die KI ist an der Rezeption. Später rufst du an, weil die Dusche kein warmes Wasser hat.",
    ),
    dict(
        id="u15", level="A2", title="Beim Arzt: Körper und Gesundheit",
        goal="Du kannst sagen, was dir wehtut, Symptome beschreiben und Ratschläge verstehen.",
        grammar="""**doler = wehtun** funktioniert wie *gustar*:
• *Me duele la cabeza.* = Mir tut der Kopf weh.
• *Me duelen los pies.* = Mir tun die Füße weh.
• *¿Te duele?* = Tut es dir weh?

Körperteile mit Artikel, nicht mit Possessiv: *Me duele **la** espalda* (nicht: *mi espalda*).

**tener + Nomen** für Symptome: *tengo fiebre* (Fieber), *tengo tos* (Husten), *tengo gripe* (Grippe), *estoy resfriado* (erkältet).

**Ratschläge:** *tienes que* + Infinitiv (du musst), *hay que* (man muss), *deberías* (du solltest).""",
        vocab=[
            ("la cabeza", "der Kopf"), ("la garganta", "der Hals (innen)"), ("el estómago", "der Magen"),
            ("la espalda", "der Rücken"), ("el brazo", "der Arm"), ("la pierna", "das Bein"), ("el pie", "der Fuß"),
            ("los ojos", "die Augen"), ("la fiebre", "das Fieber"), ("la tos", "der Husten"),
            ("resfriado", "erkältet"), ("la pastilla", "die Tablette"), ("la receta", "das Rezept"),
            ("el centro de salud", "das Gesundheitszentrum / die Arztpraxis"), ("la cita médica", "der Arzttermin"),
            ("la alergia", "die Allergie"),
        ],
        phrases=[
            ("Me duele mucho la cabeza.", "Ich habe starke Kopfschmerzen."),
            ("Tengo fiebre desde ayer.", "Ich habe seit gestern Fieber."),
            ("Me duele la garganta y tengo tos.", "Mir tut der Hals weh und ich habe Husten."),
            ("Soy alérgico a la penicilina.", "Ich bin allergisch gegen Penicillin."),
            ("Quería pedir cita con el médico.", "Ich würde gern einen Arzttermin vereinbaren."),
            ("Tiene que tomar una pastilla cada ocho horas.", "Sie müssen alle acht Stunden eine Tablette nehmen."),
            ("Deberías descansar.", "Du solltest dich ausruhen."),
            ("¿Necesito receta?", "Brauche ich ein Rezept?"),
        ],
        dialogue=[
            ("A", "Buenos días. ¿Qué le pasa?", "Guten Tag. Was fehlt Ihnen?"),
            ("B", "Me duele mucho la garganta y tengo fiebre.", "Mir tut der Hals sehr weh und ich habe Fieber."),
            ("A", "¿Desde cuándo?", "Seit wann?"),
            ("B", "Desde hace dos días. Y también me duele la cabeza.", "Seit zwei Tagen. Und ich habe auch Kopfschmerzen."),
            ("A", "Abra la boca, por favor… Es una infección.", "Öffnen Sie bitte den Mund … Das ist eine Infektion."),
            ("B", "¿Es grave?", "Ist es schlimm?"),
            ("A", "No, no se preocupe. Tome estas pastillas y descanse.", "Nein, keine Sorge. Nehmen Sie diese Tabletten und ruhen Sie sich aus."),
        ],
        roleplay="Du bist im Urlaub krank geworden. Die KI ist die Ärztin im Centro de Salud. Beschreib deine Symptome und frag nach Medikamenten.",
    ),
    dict(
        id="u16", level="A2", title="Was hast du heute gemacht? (Perfekt)",
        goal="Du kannst erzählen, was du heute, diese Woche oder schon einmal gemacht hast.",
        grammar="""**Pretérito perfecto = haber + Partizip**
haber: **he, has, ha, hemos, habéis, han**
Partizip: -ar → **-ado** (*hablado*), -er/-ir → **-ido** (*comido, vivido*)
• *Hoy he trabajado mucho.* = Heute habe ich viel gearbeitet.

**Wann?** In Spanien für Zeiträume, die noch nicht vorbei sind oder einen Bezug zur Gegenwart haben: *hoy, esta mañana, esta semana, este año, ya* (schon), *todavía no* (noch nicht), *alguna vez* (jemals), *nunca*.

**Unregelmäßige Partizipien:** hacer → **hecho**, ver → **visto**, escribir → **escrito**, decir → **dicho**, poner → **puesto**, volver → **vuelto**, abrir → **abierto**, romper → **roto**.

**haber und Partizip bleiben zusammen:** *Ya lo he hecho.* (nie: *He ya lo hecho*).""",
        vocab=[
            ("hoy", "heute"), ("esta semana", "diese Woche"), ("ya", "schon / bereits"), ("todavía no", "noch nicht"),
            ("alguna vez", "schon einmal / jemals"), ("nunca", "nie"), ("hecho", "gemacht"), ("visto", "gesehen"),
            ("escrito", "geschrieben"), ("dicho", "gesagt"), ("vuelto", "zurückgekommen"), ("abierto", "geöffnet"),
            ("roto", "kaputt / zerbrochen"), ("probar", "probieren"), ("olvidar", "vergessen"), ("perder", "verlieren"),
        ],
        phrases=[
            ("¿Qué has hecho hoy?", "Was hast du heute gemacht?"),
            ("Esta mañana he ido al gimnasio.", "Heute Morgen bin ich ins Fitnessstudio gegangen."),
            ("Todavía no he comido.", "Ich habe noch nicht gegessen."),
            ("¿Has estado alguna vez en México?", "Warst du schon einmal in Mexiko?"),
            ("Nunca he probado el pulpo.", "Ich habe noch nie Krake probiert."),
            ("He perdido mis llaves.", "Ich habe meine Schlüssel verloren."),
            ("Ya he visto esa película.", "Den Film habe ich schon gesehen."),
            ("Esta semana he trabajado mucho.", "Diese Woche habe ich viel gearbeitet."),
        ],
        dialogue=[
            ("A", "¡Qué cara de cansado! ¿Qué has hecho hoy?", "Du siehst müde aus! Was hast du heute gemacht?"),
            ("B", "Uf, me he levantado a las seis y he trabajado diez horas.", "Puh, ich bin um sechs aufgestanden und habe zehn Stunden gearbeitet."),
            ("A", "¿Y has comido algo?", "Und hast du etwas gegessen?"),
            ("B", "Solo un bocadillo. Todavía no he cenado.", "Nur ein Baguette. Ich habe noch nicht zu Abend gegessen."),
            ("A", "¿Has probado el restaurante nuevo de la esquina?", "Hast du das neue Restaurant an der Ecke schon probiert?"),
            ("B", "No, nunca he ido. ¿Vamos?", "Nein, ich war noch nie dort. Gehen wir?"),
        ],
        roleplay="Die KI ist deine Mitbewohnerin. Erzählt euch gegenseitig, was ihr heute und diese Woche gemacht habt, und was ihr noch nie gemacht habt.",
    ),
    dict(
        id="u17", level="A2", title="Gestern und letztes Jahr (Indefinido)",
        goal="Du kannst abgeschlossene Ereignisse erzählen: gestern, letzte Woche, im Urlaub.",
        grammar="""**Pretérito indefinido** für abgeschlossene Handlungen in einem vergangenen Zeitraum: *ayer, anoche, la semana pasada, el año pasado, en 2019, hace dos años*.

**Regelmäßig**
• -ar (*hablar*): habl**é**, habl**aste**, habl**ó**, habl**amos**, habl**asteis**, habl**aron**
• -er/-ir (*comer*): com**í**, com**iste**, com**ió**, com**imos**, com**isteis**, com**ieron**

**Sehr wichtige unregelmäßige Formen**
• *ir* und *ser* (gleiche Formen!): **fui, fuiste, fue, fuimos, fuisteis, fueron**
• *hacer*: hice, hiciste, **hizo**, hicimos, hicisteis, hicieron
• *tener*: tuve, tuviste, tuvo … / *estar*: estuve, estuviste, estuvo …

**Betonung zählt:** *hablo* (ich spreche) vs. *habló* (er sprach).

**Perfekt oder Indefinido?** *Hoy he comido paella.* vs. *Ayer comí paella.*""",
        vocab=[
            ("ayer", "gestern"), ("anoche", "gestern Abend / letzte Nacht"), ("anteayer", "vorgestern"),
            ("la semana pasada", "letzte Woche"), ("el año pasado", "letztes Jahr"), ("hace dos años", "vor zwei Jahren"),
            ("fui", "ich ging / ich war"), ("fue", "er/sie ging / war"), ("hice", "ich machte"),
            ("tuve", "ich hatte"), ("estuve", "ich war (Ort)"), ("las vacaciones", "der Urlaub / die Ferien"),
            ("la playa", "der Strand"), ("visitar", "besuchen"), ("conocer", "kennenlernen"), ("de repente", "plötzlich"),
        ],
        phrases=[
            ("¿Qué hiciste ayer?", "Was hast du gestern gemacht?"),
            ("Ayer fui al cine con unos amigos.", "Gestern bin ich mit Freunden ins Kino gegangen."),
            ("El año pasado estuve en Barcelona.", "Letztes Jahr war ich in Barcelona."),
            ("Conocí a mi pareja hace cinco años.", "Ich habe meinen Partner vor fünf Jahren kennengelernt."),
            ("Anoche cenamos en un restaurante italiano.", "Gestern Abend haben wir in einem italienischen Restaurant gegessen."),
            ("¿Qué tal las vacaciones?", "Wie war der Urlaub?"),
            ("Fue un viaje increíble.", "Es war eine unglaubliche Reise."),
            ("Tuve que trabajar el fin de semana.", "Ich musste am Wochenende arbeiten."),
        ],
        dialogue=[
            ("A", "¿Qué tal tus vacaciones en Andalucía?", "Wie war dein Urlaub in Andalusien?"),
            ("B", "¡Genial! Primero estuve tres días en Sevilla.", "Super! Zuerst war ich drei Tage in Sevilla."),
            ("A", "¿Y qué hiciste allí?", "Und was hast du dort gemacht?"),
            ("B", "Visité la catedral y por la noche vi un espectáculo de flamenco.", "Ich habe die Kathedrale besichtigt und abends eine Flamenco-Show gesehen."),
            ("A", "¡Qué envidia! ¿Y después?", "Wie beneidenswert! Und danach?"),
            ("B", "Después fui a Cádiz y pasé una semana en la playa.", "Danach bin ich nach Cádiz gefahren und habe eine Woche am Strand verbracht."),
            ("A", "¿Y comiste bien?", "Und hast du gut gegessen?"),
            ("B", "¡Muchísimo! Probé el pescaíto frito. ¡Riquísimo!", "Sehr viel! Ich habe frittierten Fisch probiert. Super lecker!"),
        ],
        roleplay="Du kommst aus dem Urlaub zurück. Die KI ist eine Kollegin und fragt neugierig: Wo warst du, was hast du gemacht, was hast du gegessen, was war das Beste?",
    ),
    dict(
        id="u18", level="A2", title="Früher war alles … (Imperfecto)",
        goal="Du kannst beschreiben, wie etwas früher war, und Geschichten mit Hintergrund erzählen.",
        grammar="""**Pretérito imperfecto** = Beschreibung, Gewohnheit, Hintergrund in der Vergangenheit („früher immer“, „gerade dabei“).

**Bildung (fast immer regelmäßig)**
• -ar: habl**aba**, habl**abas**, habl**aba**, habl**ábamos**, habl**abais**, habl**aban**
• -er/-ir: com**ía**, com**ías**, com**ía**, com**íamos**, com**íais**, com**ían**
• Nur drei unregelmäßige: *ser* (era), *ir* (iba), *ver* (veía)

**Imperfecto oder Indefinido?**
• Imperfecto = Kulisse: *Hacía sol y yo caminaba por la playa…*
• Indefinido = Handlung, die passiert: *…cuando de repente vi a mi ex.*

**Signalwörter:** *antes* (früher), *de niño* (als Kind), *cuando era pequeño*, *siempre*, *todos los días*, *normalmente*.""",
        vocab=[
            ("antes", "früher / vorher"), ("de niño", "als Kind"), ("era", "ich war / er war"), ("iba", "ich ging"),
            ("tenía", "ich hatte"), ("vivía", "ich wohnte"), ("jugaba", "ich spielte"), ("el pueblo", "das Dorf"),
            ("el colegio", "die Schule"), ("los dibujos animados", "die Zeichentrickfilme"), ("tímido", "schüchtern"),
            ("travieso", "frech"), ("los recuerdos", "die Erinnerungen"), ("echar de menos", "vermissen"),
            ("mientras", "während"), ("de repente", "plötzlich"),
        ],
        phrases=[
            ("De niño vivía en un pueblo pequeño.", "Als Kind wohnte ich in einem kleinen Dorf."),
            ("Cuando era pequeño, era muy tímido.", "Als ich klein war, war ich sehr schüchtern."),
            ("Todos los veranos íbamos a la playa.", "Jeden Sommer fuhren wir an den Strand."),
            ("Antes no me gustaban las verduras.", "Früher mochte ich kein Gemüse."),
            ("Mi abuela siempre cocinaba los domingos.", "Meine Oma kochte immer sonntags."),
            ("Echo de menos esos tiempos.", "Ich vermisse diese Zeiten."),
            ("Mientras dormía, sonó el teléfono.", "Während ich schlief, klingelte das Telefon."),
        ],
        dialogue=[
            ("A", "¿Dónde vivías cuando eras niña?", "Wo hast du gewohnt, als du ein Kind warst?"),
            ("B", "En un pueblo de Galicia. Era muy tranquilo.", "In einem Dorf in Galicien. Es war sehr ruhig."),
            ("A", "¿Y qué hacías en tu tiempo libre?", "Und was hast du in deiner Freizeit gemacht?"),
            ("B", "Jugaba en la calle con mis primos todo el día.", "Ich habe den ganzen Tag mit meinen Cousins auf der Straße gespielt."),
            ("A", "¡Qué bonito! Yo veía mucha tele.", "Wie schön! Ich habe viel ferngesehen."),
            ("B", "Ja, ja. ¿Y qué dibujos animados te gustaban?", "Haha. Und welche Zeichentrickfilme mochtest du?"),
            ("A", "Me encantaba Doraemon. ¡Lo veía todos los días!", "Ich liebte Doraemon. Ich habe es jeden Tag geschaut!"),
        ],
        roleplay="Die KI ist eine ältere Dame aus einem spanischen Dorf. Fragt euch gegenseitig, wie eure Kindheit war, und vergleicht früher mit heute.",
    ),
    dict(
        id="u19", level="A2", title="Im Restaurant",
        goal="Du kannst einen Tisch reservieren, bestellen, um Empfehlungen bitten und dich höflich beschweren.",
        grammar="""**Indirekte Objektpronomen:** me, te, **le**, nos, os, **les** (mir, dir, ihm/ihr/Ihnen …)
• *¿Me trae la carta?* = Bringen Sie mir die Karte?
• *¿Qué nos recomienda?* = Was empfehlen Sie uns?

**Kombination:** Zwei Pronomen, erst indirekt, dann direkt: *¿Me lo trae?* Aus *le/les* + *lo/la* wird **se**: *Se lo traigo enseguida.* (Ich bringe es Ihnen sofort.)

**Spanische Essenszeiten:** Mittagessen ca. 14–16 Uhr, Abendessen ab 21 Uhr. Das *menú del día* (Mittagsmenü) besteht aus *primer plato*, *segundo plato* und *postre* + Getränk.

**Höflich beschweren:** *Perdone, pero…*, *Creo que hay un error en la cuenta.*""",
        vocab=[
            ("la carta", "die Speisekarte"), ("el menú del día", "das Tagesmenü"), ("el primer plato", "die Vorspeise / erster Gang"),
            ("el segundo plato", "das Hauptgericht"), ("el postre", "der Nachtisch"), ("la bebida", "das Getränk"),
            ("la ración", "die Portion"), ("compartir", "teilen"), ("recomendar", "empfehlen"), ("la propina", "das Trinkgeld"),
            ("vegetariano", "vegetarisch"), ("picante", "scharf"), ("rico", "lecker"), ("salado", "salzig"),
            ("la mesa para dos", "der Tisch für zwei"), ("el error", "der Fehler"),
        ],
        phrases=[
            ("Una mesa para dos, por favor.", "Einen Tisch für zwei, bitte."),
            ("¿Qué nos recomienda?", "Was empfehlen Sie uns?"),
            ("De primero, gazpacho, y de segundo, merluza.", "Als Vorspeise Gazpacho und als Hauptgericht Seehecht."),
            ("¿Tienen platos vegetarianos?", "Haben Sie vegetarische Gerichte?"),
            ("Vamos a compartir unas raciones.", "Wir teilen uns ein paar Portionen."),
            ("Perdone, la sopa está fría.", "Entschuldigung, die Suppe ist kalt."),
            ("Creo que hay un error en la cuenta.", "Ich glaube, in der Rechnung ist ein Fehler."),
            ("¿Nos trae la cuenta, por favor?", "Bringen Sie uns bitte die Rechnung?"),
        ],
        dialogue=[
            ("A", "Buenas noches. ¿Tienen una reserva?", "Guten Abend. Haben Sie reserviert?"),
            ("B", "Sí, a nombre de Klein, para dos personas.", "Ja, auf den Namen Klein, für zwei Personen."),
            ("A", "Perfecto, síganme. ¿Qué van a tomar para beber?", "Perfekt, folgen Sie mir. Was möchten Sie trinken?"),
            ("B", "Una botella de vino tinto de la casa y agua.", "Eine Flasche Hausrotwein und Wasser."),
            ("A", "¿Y para comer?", "Und zum Essen?"),
            ("B", "¿Qué nos recomienda?", "Was empfehlen Sie uns?"),
            ("A", "El pulpo a la gallega está buenísimo hoy.", "Der Krake nach galicischer Art ist heute ausgezeichnet."),
            ("B", "Pues una ración de pulpo y unas croquetas, por favor.", "Dann eine Portion Krake und ein paar Kroketten, bitte."),
        ],
        roleplay="Du gehst mit einer Freundin essen. Die KI ist der Kellner. Reserviere, bestell mit Empfehlung, und am Ende stimmt etwas mit der Rechnung nicht.",
    ),
    dict(
        id="u20", level="A2", title="Pläne und Zukunft",
        goal="Du kannst über Zukunftspläne, Vorhersagen und Bedingungen sprechen.",
        grammar="""**Futuro simple** = Infinitiv + Endung: **-é, -ás, -á, -emos, -éis, -án**
• *hablaré, comerás, vivirá*
• Für Vorhersagen, Versprechen und Vermutungen: *Mañana lloverá.* / *Te llamaré.*

**Unregelmäßige Stämme (Endungen bleiben gleich)**
• tener → **tendr**é
• hacer → **har**é
• poder → **podr**é
• salir → **saldr**é
• venir → **vendr**é
• decir → **dir**é
• saber → **sabr**é
• querer → **querr**é

**ir a + Infinitiv** für feste Pläne (häufiger im Gespräch): *Voy a mudarme en junio.*

**Wenn-Sätze (real):** *Si tengo tiempo, iré a verte.* (Nach *si* steht Präsens, nie Futur!)""",
        vocab=[
            ("el futuro", "die Zukunft"), ("el próximo año", "nächstes Jahr"), ("dentro de un mes", "in einem Monat"),
            ("algún día", "eines Tages"), ("el plan", "der Plan"), ("el sueño", "der Traum"), ("mudarse", "umziehen"),
            ("ahorrar", "sparen"), ("cambiar", "ändern / wechseln"), ("conseguir", "erreichen / bekommen"),
            ("seguramente", "wahrscheinlich / sicher"), ("quizás", "vielleicht"), ("tendré", "ich werde haben"),
            ("haré", "ich werde machen"), ("podré", "ich werde können"), ("el objetivo", "das Ziel"),
        ],
        phrases=[
            ("El próximo año viviré en España.", "Nächstes Jahr werde ich in Spanien wohnen."),
            ("Voy a aprender español este año.", "Ich werde dieses Jahr Spanisch lernen."),
            ("Si tengo tiempo, te llamaré.", "Wenn ich Zeit habe, rufe ich dich an."),
            ("Algún día tendré una casa en la playa.", "Eines Tages werde ich ein Haus am Strand haben."),
            ("Quizás cambie de trabajo.", "Vielleicht wechsle ich den Job."),
            ("Mañana hará buen tiempo.", "Morgen wird schönes Wetter sein."),
            ("¿Qué harás después de la universidad?", "Was wirst du nach der Uni machen?"),
            ("Mi objetivo es hablar español con fluidez.", "Mein Ziel ist es, fließend Spanisch zu sprechen."),
        ],
        dialogue=[
            ("A", "¿Qué planes tienes para el año que viene?", "Welche Pläne hast du fürs nächste Jahr?"),
            ("B", "Voy a pedir un año sabático y viajaré por Latinoamérica.", "Ich nehme ein Sabbatjahr und reise durch Lateinamerika."),
            ("A", "¡Qué pasada! ¿Adónde irás primero?", "Wie krass! Wohin fährst du zuerst?"),
            ("B", "Primero a México y después, si puedo, a Perú.", "Zuerst nach Mexiko und danach, wenn ich kann, nach Peru."),
            ("A", "¿Y cómo lo vas a pagar?", "Und wie wirst du das bezahlen?"),
            ("B", "Llevo dos años ahorrando. ¡Será el viaje de mi vida!", "Ich spare seit zwei Jahren. Es wird die Reise meines Lebens!"),
        ],
        roleplay="Die KI ist eine Freundin, die mit dir über eure Pläne für die nächsten fünf Jahre spricht: Arbeit, Wohnen, Reisen, Spanisch.",
    ),
    dict(
        id="u21", level="A2", title="Meinung sagen und diskutieren",
        goal="Du kannst deine Meinung äußern, zustimmen, widersprechen und begründen.",
        grammar="""**Meinung äußern**
• *Creo que…* / *Pienso que…* / *Para mí…* / *En mi opinión…*
• *Me parece que…* = Mir scheint, dass …
• *Me parece bien / mal / interesante.* = Ich finde das gut / schlecht / interessant.

**Achtung:** Nach *no creo que* folgt der Subjuntivo: *No creo que sea verdad.* Mehr dazu in Einheit 23. Merk dir den Satz vorerst einfach als Ganzes.

**Zustimmen und widersprechen**
• *Estoy de acuerdo (contigo).* / *Tienes razón.* / *Exacto.*
• *No estoy de acuerdo.* / *Depende.* / *Sí, pero…*

**Begründen und verbinden:** *porque* (weil), *por eso* (deshalb), *sin embargo* (jedoch), *además* (außerdem), *por un lado… por otro lado…* (einerseits … andererseits …).""",
        vocab=[
            ("creo que", "ich glaube, dass"), ("en mi opinión", "meiner Meinung nach"), ("estar de acuerdo", "einverstanden sein / zustimmen"),
            ("tener razón", "recht haben"), ("depende", "kommt drauf an"), ("porque", "weil"), ("por eso", "deshalb"),
            ("sin embargo", "jedoch"), ("además", "außerdem"), ("la ventaja", "der Vorteil"), ("la desventaja", "der Nachteil"),
            ("el problema", "das Problem"), ("la solución", "die Lösung"), ("importante", "wichtig"),
            ("la verdad", "die Wahrheit"), ("en cambio", "dagegen / hingegen"),
        ],
        phrases=[
            ("Creo que tienes razón.", "Ich glaube, du hast recht."),
            ("No estoy de acuerdo contigo.", "Ich stimme dir nicht zu."),
            ("Para mí, lo más importante es la salud.", "Für mich ist das Wichtigste die Gesundheit."),
            ("Me parece una idea genial.", "Ich finde das eine super Idee."),
            ("Depende de la situación.", "Das kommt auf die Situation an."),
            ("Por un lado es barato, pero por otro lado es lento.", "Einerseits ist es günstig, andererseits ist es langsam."),
            ("No creo que sea verdad.", "Ich glaube nicht, dass das stimmt."),
            ("La ventaja es que puedes trabajar desde casa.", "Der Vorteil ist, dass man von zu Hause arbeiten kann."),
        ],
        dialogue=[
            ("A", "¿Qué te parece vivir en una gran ciudad?", "Was hältst du davon, in einer Großstadt zu leben?"),
            ("B", "Me parece genial. Hay muchas cosas que hacer.", "Ich finde es super. Es gibt viel zu tun."),
            ("A", "Sí, pero también es caro y estresante.", "Ja, aber es ist auch teuer und stressig."),
            ("B", "Tienes razón. Sin embargo, en el campo no hay trabajo.", "Da hast du recht. Auf dem Land gibt es aber keine Arbeit."),
            ("A", "Bueno, depende. Con el teletrabajo, eso está cambiando.", "Na ja, kommt drauf an. Mit dem Homeoffice ändert sich das."),
            ("B", "Es verdad. Quizás en el futuro me mude a un pueblo.", "Stimmt. Vielleicht ziehe ich in Zukunft in ein Dorf."),
        ],
        roleplay="Diskutiere mit der KI über ein Thema deiner Wahl, z. B. Stadt oder Land, Homeoffice, soziale Medien. Die KI vertritt die Gegenmeinung, du begründest deine.",
    ),
    dict(
        id="u22", level="A2", title="Ratschläge, Bitten und Anweisungen (Imperativ)",
        goal="Du kannst Ratschläge geben, um etwas bitten und Anweisungen verstehen.",
        grammar="""**Imperativ (tú), bejaht** = 3. Person Singular Präsens:
*habla, come, escribe* (sprich, iss, schreib)
Unregelmäßig: *ven* (komm), *ten* (hab), *pon* (stell), *sal* (geh raus), *haz* (mach), *di* (sag), *ve* (geh), *sé* (sei).

**Imperativ (usted)**: Vokalwechsel -ar → **-e**, -er/-ir → **-a**: *hable, coma, escriba*.

**Verneint (tú):** *no hables, no comas, no escribas* (gleich wie Subjuntivo).

**Pronomen hängen an bejahte Imperative:** *Dímelo.* (Sag es mir.), *Siéntate.* (Setz dich.). Bei Verneinung stehen sie davor: *No me lo digas.*

**Weichere Ratschläge:** *Deberías…*, *¿Por qué no…?*, *Te recomiendo…*, *Yo que tú…* (Ich an deiner Stelle …).""",
        vocab=[
            ("ven", "komm"), ("haz", "mach"), ("di", "sag"), ("pon", "stell / leg"), ("ten cuidado", "pass auf"),
            ("espera", "warte"), ("mira", "schau"), ("escucha", "hör zu"), ("siéntate", "setz dich"),
            ("no te preocupes", "mach dir keine Sorgen"), ("el consejo", "der Ratschlag"), ("deberías", "du solltest"),
            ("yo que tú", "ich an deiner Stelle"), ("ayudar", "helfen"), ("dejar", "lassen / leihen"), ("repetir", "wiederholen"),
        ],
        phrases=[
            ("Ven aquí un momento.", "Komm mal kurz her."),
            ("No te preocupes, todo va a salir bien.", "Mach dir keine Sorgen, alles wird gut."),
            ("Ten cuidado con el bolso en el metro.", "Pass in der U-Bahn auf deine Tasche auf."),
            ("¿Me puedes ayudar, por favor?", "Kannst du mir bitte helfen?"),
            ("¿Me dejas tu cargador?", "Leihst du mir dein Ladegerät?"),
            ("Yo que tú, hablaría con él.", "An deiner Stelle würde ich mit ihm reden."),
            ("¿Por qué no ves series en español?", "Warum schaust du nicht Serien auf Spanisch?"),
            ("Repite, por favor. No te he entendido.", "Wiederhol bitte. Ich habe dich nicht verstanden."),
        ],
        dialogue=[
            ("A", "No sé qué hacer. Mi español no mejora.", "Ich weiß nicht, was ich tun soll. Mein Spanisch wird nicht besser."),
            ("B", "Tranquilo. ¿Cuánto practicas al día?", "Ganz ruhig. Wie viel übst du am Tag?"),
            ("A", "Bueno… solo los fines de semana.", "Na ja … nur am Wochenende."),
            ("B", "Pues practica un poco todos los días. Es mejor que mucho una vez.", "Dann üb jeden Tag ein bisschen. Das ist besser als einmal viel."),
            ("A", "¿Y qué más me recomiendas?", "Und was empfiehlst du mir noch?"),
            ("B", "Escucha podcasts y habla con nativos. ¡Y no tengas miedo de equivocarte!", "Hör Podcasts und sprich mit Muttersprachlern. Und hab keine Angst, Fehler zu machen!"),
        ],
        roleplay="Die KI hat ein Problem (z. B. findet keine Wohnung, ist gestresst, will fitter werden) und bittet dich um Rat. Gib ihr Tipps mit Imperativ und „deberías“.",
    ),
    dict(
        id="u23", level="B1", title="Wünsche und Gefühle (Subjuntivo)",
        goal="Du kannst Wünsche, Hoffnungen und Gefühle über andere ausdrücken.",
        grammar="""**Presente de subjuntivo:** Der „Wunsch- und Gefühlsmodus“. Bildung: yo-Form Präsens, -o weg, „gegenteiliger“ Vokal:
• -ar → **-e**: hablar → habl**e**, habl**es**, habl**e**, habl**emos**, habl**éis**, habl**en**
• -er/-ir → **-a**: tener (tengo) → teng**a**, teng**as** … / venir → veng**a**
• Unregelmäßig: ser → **sea**, ir → **vaya**, estar → **esté**, saber → **sepa**, haber → **haya**, dar → **dé**

**Wann?** Wenn im Hauptsatz ein Wunsch, Gefühl oder Zweifel steht **und** das Subjekt wechselt:
• *Quiero **que** vengas.* = Ich will, dass du kommst.
• *Espero que estés bien.* = Ich hoffe, dir geht es gut.
• *Me alegro de que estés aquí.* = Ich freue mich, dass du hier bist.
• Gleiches Subjekt → Infinitiv: *Quiero venir.*

**Feste Wendungen:** *¡Que te vaya bien!*, *¡Que aproveche!* (Guten Appetit), *¡Que descanses!*, *¡Que te mejores!* (Gute Besserung), *Ojalá…* (hoffentlich).""",
        vocab=[
            ("esperar que", "hoffen, dass"), ("querer que", "wollen, dass"), ("ojalá", "hoffentlich"),
            ("alegrarse", "sich freuen"), ("tener miedo", "Angst haben"), ("preocuparse", "sich Sorgen machen"),
            ("contento", "froh / zufrieden"), ("triste", "traurig"), ("enfadado", "verärgert / sauer"), ("nervioso", "nervös"),
            ("orgulloso", "stolz"), ("la esperanza", "die Hoffnung"), ("¡Que aproveche!", "Guten Appetit!"),
            ("¡Que te mejores!", "Gute Besserung!"), ("¡Que descanses!", "Schlaf gut! / Ruh dich aus!"), ("es una pena que", "es ist schade, dass"),
        ],
        phrases=[
            ("Espero que estés bien.", "Ich hoffe, es geht dir gut."),
            ("Quiero que vengas a mi fiesta.", "Ich möchte, dass du zu meiner Party kommst."),
            ("Ojalá haga sol mañana.", "Hoffentlich scheint morgen die Sonne."),
            ("Me alegro de que estés aquí.", "Ich freue mich, dass du hier bist."),
            ("Es una pena que no puedas venir.", "Schade, dass du nicht kommen kannst."),
            ("Mis padres quieren que estudie medicina.", "Meine Eltern wollen, dass ich Medizin studiere."),
            ("¡Que te mejores pronto!", "Gute Besserung!"),
            ("No quiero que te preocupes.", "Ich will nicht, dass du dir Sorgen machst."),
        ],
        dialogue=[
            ("A", "Mañana tengo la entrevista de trabajo. Estoy muy nerviosa.", "Morgen habe ich das Vorstellungsgespräch. Ich bin sehr nervös."),
            ("B", "¡Seguro que te sale genial! Ojalá te den el puesto.", "Bestimmt läuft es super! Hoffentlich bekommst du die Stelle."),
            ("A", "Gracias. Mis padres quieren que acepte cualquier cosa.", "Danke. Meine Eltern wollen, dass ich alles annehme."),
            ("B", "Bueno, lo importante es que tú estés contenta.", "Na ja, das Wichtigste ist, dass du zufrieden bist."),
            ("A", "Tienes razón. Te escribo cuando termine.", "Du hast recht. Ich schreibe dir, wenn ich fertig bin."),
            ("B", "Vale. ¡Mucha suerte y que descanses esta noche!", "Okay. Viel Glück und schlaf gut heute Nacht!"),
        ],
        roleplay="Die KI ist eine gute Freundin vor einem wichtigen Ereignis (Prüfung, Hochzeit, Umzug). Mach ihr Mut, sag, was du hoffst und dir für sie wünschst. Benutze den Subjuntivo.",
    ),
    dict(
        id="u24", level="B1", title="Natürlich klingen: Smalltalk und Füllwörter",
        goal="Du klingst natürlicher: mit Füllwörtern, Reaktionen und typischen Ausdrücken aus dem Alltag.",
        grammar="""Muttersprachler sprechen nicht in Lehrbuchsätzen. Diese kleinen Wörter machen dich sofort natürlicher und geben dir Zeit zum Nachdenken:

**Zeit gewinnen:** *pues…* (also …), *a ver…* (mal sehen …), *bueno…* (na ja …), *es que…* (es ist so, dass …), *o sea* (also / das heißt), *¿cómo se dice…?* (wie sagt man …?)

**Reagieren:** *¿En serio?* (Echt?), *¡No me digas!* (Was du nicht sagst!), *¡Qué fuerte!* (Krass!), *¡Qué rollo!* (Wie öde!), *¡Qué guay!* (Wie cool!, Spanien), *Ya.* (Ja, verstehe.), *Claro.* (Klar.)

**Bestätigung:** *¿sabes?*, *¿no?*, *¿vale?* am Satzende

**Typisch Spanien:** *vale* (okay), *venga* (los / komm schon / tschüss), *tío / tía* (Alter / Mann, unter Freunden), *mola* (ist cool), *currar* (arbeiten, umgangssprachlich)

**Tipp:** Sag lieber *es que…* und such das Wort, als zu schweigen. Und wenn dir ein Wort fehlt, umschreib es: *es una cosa que sirve para…* (ein Ding, mit dem man …).""",
        vocab=[
            ("pues", "also / tja"), ("a ver", "mal sehen"), ("o sea", "also / das heißt"), ("es que", "es ist nämlich so, dass"),
            ("¿en serio?", "echt? / im Ernst?"), ("¡no me digas!", "was du nicht sagst!"), ("¡qué fuerte!", "krass! / heftig!"),
            ("¡qué guay!", "wie cool!"), ("venga", "los / komm schon / na dann"), ("mola", "ist cool"),
            ("currar", "arbeiten (ugs.)"), ("la movida", "die Sache / das Ding (ugs.)"), ("ya", "ja, verstehe / schon"),
            ("claro", "klar"), ("¿sabes?", "weißt du?"), ("de hecho", "tatsächlich / eigentlich"),
        ],
        phrases=[
            ("Pues no sé, la verdad.", "Tja, ich weiß es ehrlich gesagt nicht."),
            ("A ver, ¿cómo te lo explico?", "Mal sehen, wie erkläre ich dir das?"),
            ("Es que hoy no puedo, tengo mucho curro.", "Heute geht's leider nicht, ich habe viel Arbeit."),
            ("¿En serio? ¡Qué fuerte!", "Echt? Krass!"),
            ("O sea, que no vienes.", "Also kommst du nicht."),
            ("¡Venga, vamos!", "Komm, los geht's!"),
            ("Me mola mucho tu chaqueta.", "Deine Jacke ist echt cool."),
            ("No sé cómo se dice… es una cosa para abrir botellas.", "Ich weiß nicht, wie man sagt … ein Ding zum Flaschenöffnen."),
        ],
        dialogue=[
            ("A", "Tía, ¿sabes qué? ¡Me han dado el trabajo!", "Weißt du was? Ich habe den Job bekommen!"),
            ("B", "¿En serio? ¡Qué guay! ¡Enhorabuena!", "Echt? Wie cool! Glückwunsch!"),
            ("A", "Sí, pero es que tengo que mudarme a Bilbao.", "Ja, aber ich muss nach Bilbao umziehen."),
            ("B", "¡No me digas! O sea, ¿que te vas?", "Was du nicht sagst! Also gehst du weg?"),
            ("A", "Pues sí… en septiembre.", "Tja, ja … im September."),
            ("B", "Bueno, Bilbao mola mucho. ¡Iré a visitarte!", "Na ja, Bilbao ist echt cool. Ich besuche dich!"),
            ("A", "¡Venga! Te espero allí.", "Abgemacht! Ich warte dort auf dich."),
        ],
        roleplay="Lockerer Smalltalk mit der KI als spanischem Kumpel in einer Bar. Ziel: Benutze mindestens fünf Füllwörter und Reaktionen (pues, a ver, ¿en serio?, o sea, venga …).",
    ),
    dict(
        id="u25", level="B1", title="Telefonieren und Probleme lösen",
        goal="Du kannst am Telefon Anliegen klären, reklamieren und Lösungen aushandeln.",
        grammar="""**Am Telefon**
• Abnehmen: *¿Sí?* / *¿Dígame?* / *¿Diga?* (Spanien), *¿Bueno?* (Mexiko)
• *¿De parte de quién?* = Wer ist am Apparat?
• *Le paso.* = Ich verbinde Sie.
• *Se ha cortado.* = Die Verbindung ist abgebrochen.

**Indirekte Rede (Gegenwart):** *Dice que…* + gleiche Zeit: *Dice que llega tarde.*
**Indirekte Fragen:** *¿Sabe si…?* (Wissen Sie, ob …?), *Quería saber cuándo…* (Ich wollte wissen, wann …)

**Problem erklären:** *El problema es que…*, *Resulta que…* (Es ist so, dass …), *Llevo una semana esperando* (Ich warte seit einer Woche).
**llevar + Gerundium** = seit … etwas tun: *Llevo dos horas llamando.*
Gerundium: -ar → **-ando**, -er/-ir → **-iendo** (*esperando, comiendo*).

**Lösung fordern:** *¿Qué solución me pueden ofrecer?*, *Quiero que me devuelvan el dinero.* (Subjuntivo!)""",
        vocab=[
            ("llamar", "anrufen"), ("¿dígame?", "hallo? (am Telefon)"), ("¿de parte de quién?", "wer ist am Apparat?"),
            ("el mensaje", "die Nachricht"), ("colgar", "auflegen"), ("se ha cortado", "die Verbindung ist abgebrochen"),
            ("el pedido", "die Bestellung"), ("el paquete", "das Paket"), ("la factura", "die Rechnung (offiziell)"),
            ("devolver", "zurückgeben / erstatten"), ("la queja", "die Beschwerde"), ("resulta que", "es ist so, dass"),
            ("cuanto antes", "so schnell wie möglich"), ("el plazo", "die Frist"), ("solucionar", "lösen"),
            ("el número de cliente", "die Kundennummer"),
        ],
        phrases=[
            ("Hola, llamo por un problema con mi pedido.", "Hallo, ich rufe wegen eines Problems mit meiner Bestellung an."),
            ("Resulta que el paquete no ha llegado.", "Es ist so, dass das Paket nicht angekommen ist."),
            ("Llevo dos semanas esperando.", "Ich warte seit zwei Wochen."),
            ("¿Me puede decir el número de pedido?", "Können Sie mir die Bestellnummer sagen?"),
            ("Quiero que me devuelvan el dinero.", "Ich möchte, dass Sie mir das Geld zurückerstatten."),
            ("¿Puede repetirlo, por favor? Se oye muy mal.", "Können Sie das wiederholen? Man hört sehr schlecht."),
            ("Perdone, se ha cortado la llamada.", "Entschuldigung, die Verbindung war weg."),
            ("¿Le puedo dejar un mensaje?", "Kann ich ihm/ihr eine Nachricht hinterlassen?"),
        ],
        dialogue=[
            ("A", "Atención al cliente, le atiende Carmen. ¿En qué puedo ayudarle?", "Kundenservice, Sie sprechen mit Carmen. Wie kann ich Ihnen helfen?"),
            ("B", "Hola, llamo porque mi pedido llegó roto.", "Hallo, ich rufe an, weil meine Bestellung kaputt angekommen ist."),
            ("A", "Vaya, lo siento mucho. ¿Me da su número de pedido?", "Oh, das tut mir sehr leid. Geben Sie mir Ihre Bestellnummer?"),
            ("B", "Sí, es el cuatro, siete, dos, nueve, cero.", "Ja, das ist die vier, sieben, zwei, neun, null."),
            ("A", "Gracias. ¿Prefiere un cambio o que le devolvamos el dinero?", "Danke. Möchten Sie einen Umtausch oder dass wir Ihnen das Geld zurückerstatten?"),
            ("B", "Prefiero un cambio, pero lo necesito cuanto antes.", "Lieber einen Umtausch, aber ich brauche es so schnell wie möglich."),
            ("A", "Sin problema. Le llegará en dos o tres días.", "Kein Problem. Es kommt in zwei bis drei Tagen bei Ihnen an."),
        ],
        roleplay="Ruf bei einem Kundenservice an (die KI). Dein Internet funktioniert seit einer Woche nicht. Erklär das Problem, bleib hartnäckig und handle eine Lösung aus.",
    ),
]
