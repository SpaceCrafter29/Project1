# Kursinhalte Teil 1: Aussprache + A1 (Einheiten u00–u12)
# Spanisch (Spanien), Erklärungen auf Deutsch.
# vocab/phrases: (spanisch, deutsch)  dialogue: (sprecher, spanisch, deutsch)

UNITS_A1 = [
    dict(
        id="u00", level="A1", title="Aussprache: So klingt Spanisch",
        goal="Du kennst die spanischen Laute und sprichst Wörter so aus, wie sie geschrieben werden.",
        grammar="""Spanisch wird fast immer so gesprochen, wie es geschrieben wird. Wenn du die Regeln einmal kannst, kannst du jedes Wort lesen.

• **Vokale** a, e, i, o, u sind immer kurz und klar, nie verschluckt: *casa* = „ka-sa“, nicht „kaase“.
• **h** ist stumm: *hola* = „ola“.
• **j** und **g** vor e/i = Kehllaut wie „ch“ in „Bach“: *jamón*, *gente*.
• **ll** und **y** ≈ deutsches „j“: *llave* = „jabe“.
• **ñ** = „nj“ wie in „Cognac“: *niño*.
• **z** und **c** vor e/i = gelispeltes „th“ wie englisch *think* (in Lateinamerika „s“): *cerveza*.
• **qu** = „k“ (das u ist stumm): *queso* = „keso“.
• **b** und **v** klingen gleich, weich zwischen den Lippen: *vino* ≈ „bino“.
• **r** einfach gerollt (Zungenspitze tippt einmal), **rr** und r am Wortanfang kräftig gerollt: *pero* (aber) vs. *perro* (Hund).
• **s** ist immer stimmlos und scharf, nie wie das deutsche „s“ in „Sonne“.

**Betonung:** Endet ein Wort auf Vokal, n oder s, wird die vorletzte Silbe betont (*ca-sa*, *ha-blan*). Sonst die letzte (*ha-blar*, *ciu-dad*). Ein Akzent (´) zeigt Ausnahmen: *café*, *teléfono*.""",
        vocab=[
            ("hola", "hallo"), ("la casa", "das Haus"), ("pero", "aber"), ("el perro", "der Hund"),
            ("caro", "teuer"), ("el carro", "der Karren (in Lateinamerika: das Auto)"), ("la llave", "der Schlüssel"),
            ("el niño", "das Kind (Junge)"), ("el jamón", "der Schinken"), ("la gente", "die Leute"),
            ("el queso", "der Käse"), ("la cerveza", "das Bier"), ("el vino", "der Wein"),
            ("la guitarra", "die Gitarre"), ("el zapato", "der Schuh"), ("el teléfono", "das Telefon"),
        ],
        phrases=[
            ("El perro de Roberto corre rápido.", "Robertos Hund rennt schnell."),
            ("La gente come jamón y queso.", "Die Leute essen Schinken und Käse."),
            ("Una cerveza y un vino, por favor.", "Ein Bier und einen Wein, bitte."),
            ("Tres tristes tigres tragaban trigo en un trigal.", "Drei traurige Tiger schluckten Weizen in einem Weizenfeld. (Zungenbrecher)"),
            ("El niño tiene la llave.", "Das Kind hat den Schlüssel."),
            ("Erre con erre, guitarra.", "R mit R: Gitarre. (Kinderreim fürs rr)"),
        ],
        dialogue=[],
        roleplay="Übe Aussprache: Die KI gibt dir kurze Wörter und Sätze zum Nachsprechen, und du schreibst oder sprichst sie zurück.",
    ),
    dict(
        id="u01", level="A1", title="¡Hola! Begrüßen und vorstellen",
        goal="Du kannst grüßen, dich vorstellen, nach dem Namen fragen und dich verabschieden.",
        grammar="""**Sich vorstellen**
• *Me llamo Ana.* = Ich heiße Ana. (wörtlich: Ich nenne mich Ana.)
• *¿Cómo te llamas?* = Wie heißt du?
• *Soy Ana.* = Ich bin Ana.

**Das Verb ser (sein), Singular**
• yo **soy** = ich bin
• tú **eres** = du bist
• él / ella / usted **es** = er / sie / Sie ist (sind)

**Du oder Sie?** In Spanien duzt man fast immer (*tú*). *Usted* (Sie) benutzt du bei älteren Menschen oder sehr formell. *Usted* nimmt die Verbform von *él/ella*.

**Fragezeichen:** Fragen und Ausrufe haben vorne ein umgedrehtes Zeichen: *¿Cómo estás?* *¡Hola!*

**Subjektpronomen fallen meistens weg**, weil die Verbform schon zeigt, wer gemeint ist: *Soy de Berlín.* statt *Yo soy de Berlín.*""",
        vocab=[
            ("buenos días", "guten Morgen / guten Tag"), ("buenas tardes", "guten Tag (nachmittags)"),
            ("buenas noches", "guten Abend / gute Nacht"), ("adiós", "tschüss / auf Wiedersehen"),
            ("hasta luego", "bis später"), ("hasta mañana", "bis morgen"), ("gracias", "danke"),
            ("de nada", "gern geschehen"), ("por favor", "bitte"), ("sí", "ja"), ("no", "nein / nicht"),
            ("encantado", "freut mich (als Mann)"), ("encantada", "freut mich (als Frau)"),
            ("el nombre", "der Name"), ("el amigo", "der Freund"), ("la amiga", "die Freundin"),
        ],
        phrases=[
            ("Hola, me llamo Stefan.", "Hallo, ich heiße Stefan."),
            ("¿Cómo te llamas?", "Wie heißt du?"),
            ("¿Cómo estás?", "Wie geht es dir?"),
            ("Muy bien, gracias. ¿Y tú?", "Sehr gut, danke. Und dir?"),
            ("Mucho gusto.", "Sehr erfreut."),
            ("¿Cómo se llama usted?", "Wie heißen Sie?"),
            ("Ella es mi amiga Laura.", "Sie ist meine Freundin Laura."),
            ("Hasta luego, ¡que te vaya bien!", "Bis später, mach's gut!"),
        ],
        dialogue=[
            ("A", "¡Hola! ¿Qué tal?", "Hallo! Wie geht's?"),
            ("B", "¡Hola! Bien, ¿y tú?", "Hallo! Gut, und dir?"),
            ("A", "Muy bien. Me llamo Lucía. ¿Y tú, cómo te llamas?", "Sehr gut. Ich heiße Lucía. Und du, wie heißt du?"),
            ("B", "Me llamo Jonas. Encantado.", "Ich heiße Jonas. Freut mich."),
            ("A", "Encantada, Jonas. ¿Eres alemán?", "Freut mich, Jonas. Bist du Deutscher?"),
            ("B", "Sí, soy de Hamburgo.", "Ja, ich bin aus Hamburg."),
            ("A", "¡Qué bien! Bueno, hasta luego.", "Wie schön! Also, bis später."),
            ("B", "¡Adiós, hasta luego!", "Tschüss, bis später!"),
        ],
        roleplay="Du bist in einem Sprachcafé (intercambio) in Madrid. Die KI spielt Lucía, eine Spanierin. Begrüße sie, stell dich vor und frag, wie es ihr geht.",
    ),
    dict(
        id="u02", level="A1", title="Herkunft und Sprachen",
        goal="Du kannst sagen, woher du kommst, wo du wohnst und welche Sprachen du sprichst.",
        grammar="""**ser de** = kommen aus / sein aus: *Soy de Alemania.*

**Regelmäßige Verben auf -ar (Präsens)** am Beispiel *hablar* (sprechen):
• yo habl**o**
• tú habl**as**
• él / ella / usted habl**a**
• nosotros habl**amos**
• vosotros habl**áis** (ihr, nur in Spanien)
• ellos / ellas / ustedes habl**an**

Genauso: *vivir* ist ein -ir-Verb: viv**o**, viv**es**, viv**e**, viv**imos**, viv**ís**, viv**en**.

**Nationalitäten** haben eine männliche und eine weibliche Form: *alemán / alemana*, *español / española*. Sie werden kleingeschrieben.

**Verneinung:** einfach *no* vor das Verb: *No hablo francés.*""",
        vocab=[
            ("Alemania", "Deutschland"), ("España", "Spanien"), ("Austria", "Österreich"), ("Suiza", "die Schweiz"),
            ("alemán", "deutsch / Deutscher"), ("alemana", "Deutsche"), ("español", "spanisch / Spanier"),
            ("española", "Spanierin"), ("el inglés", "Englisch"), ("el idioma", "die Sprache"),
            ("hablar", "sprechen"), ("vivir", "wohnen / leben"), ("la ciudad", "die Stadt"),
            ("un poco", "ein bisschen"), ("también", "auch"), ("¿de dónde?", "woher?"),
        ],
        phrases=[
            ("¿De dónde eres?", "Woher kommst du?"),
            ("Soy de Alemania, de Múnich.", "Ich komme aus Deutschland, aus München."),
            ("Vivo en Berlín.", "Ich wohne in Berlin."),
            ("¿Dónde vives?", "Wo wohnst du?"),
            ("Hablo alemán e inglés.", "Ich spreche Deutsch und Englisch."),
            ("Hablo un poco de español.", "Ich spreche ein bisschen Spanisch."),
            ("No hablo francés.", "Ich spreche kein Französisch."),
            ("¿Puedes hablar más despacio, por favor?", "Kannst du bitte langsamer sprechen?"),
        ],
        dialogue=[
            ("A", "¿De dónde eres, Jonas?", "Woher kommst du, Jonas?"),
            ("B", "Soy alemán, pero vivo en Valencia.", "Ich bin Deutscher, aber ich wohne in Valencia."),
            ("A", "¡Hablas muy bien español!", "Du sprichst sehr gut Spanisch!"),
            ("B", "Gracias, pero solo hablo un poco.", "Danke, aber ich spreche nur ein bisschen."),
            ("A", "¿Y qué idiomas hablas?", "Und welche Sprachen sprichst du?"),
            ("B", "Alemán, inglés y ahora español. ¿Y tú?", "Deutsch, Englisch und jetzt Spanisch. Und du?"),
            ("A", "Yo hablo español y un poco de inglés.", "Ich spreche Spanisch und ein bisschen Englisch."),
        ],
        roleplay="Du lernst auf einer Party in Valencia jemanden kennen. Die KI fragt dich, woher du kommst, wo du wohnst und welche Sprachen du sprichst.",
    ),
    dict(
        id="u03", level="A1", title="Zahlen, Alter und Telefonnummer",
        goal="Du kannst bis 100 zählen, dein Alter sagen und Telefonnummern verstehen.",
        grammar="""**Alter mit tener (haben):** *Tengo 30 años.* = Ich bin 30 Jahre alt (wörtlich: Ich habe 30 Jahre).

**tener (Präsens):** tengo, tienes, tiene, tenemos, tenéis, tienen.

**Zahlen**
• 0–15: cero, uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez, once, doce, trece, catorce, quince
• 16–29 schreibt man zusammen: dieciséis, diecisiete, veinte, veintiuno, veintidós …
• ab 31 mit *y*: treinta **y** uno, cuarenta **y** cinco
• 30 treinta, 40 cuarenta, 50 cincuenta, 60 sesenta, 70 setenta, 80 ochenta, 90 noventa, 100 cien

**Achtung:** Im Spanischen kommt der Zehner zuerst, wie im Englischen: 45 = *cuarenta y cinco* („vierzig und fünf“), nicht „fünfundvierzig“.""",
        vocab=[
            ("uno", "eins"), ("dos", "zwei"), ("tres", "drei"), ("cuatro", "vier"), ("cinco", "fünf"),
            ("seis", "sechs"), ("siete", "sieben"), ("ocho", "acht"), ("nueve", "neun"), ("diez", "zehn"),
            ("quince", "fünfzehn"), ("veinte", "zwanzig"), ("treinta y cinco", "fünfunddreißig"),
            ("cincuenta", "fünfzig"), ("cien", "hundert"), ("el año", "das Jahr"),
        ],
        phrases=[
            ("¿Cuántos años tienes?", "Wie alt bist du?"),
            ("Tengo veintiocho años.", "Ich bin achtundzwanzig Jahre alt."),
            ("Mi hermano tiene treinta y dos años.", "Mein Bruder ist zweiunddreißig."),
            ("¿Cuál es tu número de teléfono?", "Was ist deine Telefonnummer?"),
            ("Es el seis, cuarenta y cinco, doce, treinta.", "Es ist die 6-45-12-30."),
            ("¿Cuánto es?", "Wie viel macht das?"),
            ("Son quince euros.", "Das macht fünfzehn Euro."),
        ],
        dialogue=[
            ("A", "Oye, ¿me das tu número?", "Hey, gibst du mir deine Nummer?"),
            ("B", "Claro. Es el seis, uno, siete…", "Klar. Es ist die sechs, eins, sieben …"),
            ("A", "Un momento, más despacio, por favor.", "Moment, langsamer bitte."),
            ("B", "Seis, uno, siete, veinte, cuarenta y ocho, noventa.", "Sechs, eins, sieben, zwanzig, achtundvierzig, neunzig."),
            ("A", "Perfecto, gracias. ¿Y cuántos años tienes?", "Perfekt, danke. Und wie alt bist du?"),
            ("B", "Tengo treinta y uno. ¿Y tú?", "Ich bin einunddreißig. Und du?"),
        ],
        roleplay="Ihr tauscht Telefonnummern aus und redet übers Alter. Die KI diktiert dir eine Nummer. Schreib sie als Ziffern auf und frag dann zurück.",
    ),
    dict(
        id="u04", level="A1", title="Im Café bestellen",
        goal="Du kannst im Café bestellen, nachfragen und bezahlen.",
        grammar="""**Höflich bestellen**
• *Quiero un café.* = Ich will einen Kaffee. Das ist direkt, aber in Spanien völlig normal.
• *Quería un café.* = Ich hätte gern einen Kaffee. Höflicher.
• *¿Me pone un café?* = Machen Sie mir einen Kaffee? Typisch spanisch an der Bar.
• *Para mí, un té.* = Für mich einen Tee.

**Artikel**
• männlich: **el** café / **un** café
• weiblich: **la** cerveza / **una** cerveza
• Wörter auf -o sind meist männlich, auf -a meist weiblich.

**Plural:** Vokal + **s** (*cafés*), Konsonant + **es** (*el pan → los panes*). Die Artikel werden zu *los / las* und *unos / unas*.""",
        vocab=[
            ("el café con leche", "der Milchkaffee"), ("el café solo", "der Espresso"), ("el cortado", "Espresso mit etwas Milch"),
            ("el té", "der Tee"), ("el agua", "das Wasser"), ("el zumo de naranja", "der Orangensaft"),
            ("la tostada", "das getoastete Brötchen"), ("el bocadillo", "das belegte Baguette"), ("el croissant", "das Croissant"),
            ("el azúcar", "der Zucker"), ("la cuenta", "die Rechnung"), ("el camarero", "der Kellner"),
            ("la camarera", "die Kellnerin"), ("caliente", "heiß / warm"), ("frío", "kalt"), ("algo más", "noch etwas"),
        ],
        phrases=[
            ("¿Me pone un café con leche, por favor?", "Einen Milchkaffee, bitte."),
            ("Quería una tostada con tomate.", "Ich hätte gern ein Toastbrötchen mit Tomate."),
            ("Para mí, un zumo de naranja.", "Für mich einen Orangensaft."),
            ("¿Tienen leche sin lactosa?", "Haben Sie laktosefreie Milch?"),
            ("Un agua sin gas, por favor.", "Ein stilles Wasser, bitte."),
            ("Nada más, gracias.", "Nichts weiter, danke."),
            ("La cuenta, por favor.", "Die Rechnung, bitte."),
            ("¿Puedo pagar con tarjeta?", "Kann ich mit Karte zahlen?"),
        ],
        dialogue=[
            ("A", "Buenos días. ¿Qué le pongo?", "Guten Morgen. Was darf es sein?"),
            ("B", "Buenos días. Un café con leche, por favor.", "Guten Morgen. Einen Milchkaffee, bitte."),
            ("A", "¿Algo de comer?", "Etwas zu essen?"),
            ("B", "Sí, una tostada con tomate y aceite.", "Ja, ein Toastbrötchen mit Tomate und Öl."),
            ("A", "Muy bien. ¿Algo más?", "Sehr gut. Noch etwas?"),
            ("B", "No, nada más. ¿Cuánto es?", "Nein, nichts weiter. Wie viel macht das?"),
            ("A", "Son tres euros con cincuenta.", "Das macht drei Euro fünfzig."),
            ("B", "Aquí tiene. Gracias.", "Bitte schön. Danke."),
        ],
        roleplay="Du bist morgens in einer Bar in Sevilla. Die KI ist der Kellner. Bestell Frühstück, frag nach dem Preis und bezahl mit Karte.",
    ),
    dict(
        id="u05", level="A1", title="Familie und Freunde",
        goal="Du kannst deine Familie beschreiben und andere nach ihrer Familie fragen.",
        grammar="""**Possessivbegleiter**
• mi / mis = mein(e)
• tu / tus = dein(e)
• su / sus = sein(e), ihr(e), Ihr(e)
• nuestro / nuestra = unser(e)

Beispiele: *mi hermano*, *mis hermanos*, *tu madre*, *sus padres*.

**Adjektive** stehen meistens hinter dem Nomen und passen sich an: *un hermano alto*, *una hermana alta*, *mis padres simpáticos*.

**los padres** = die Eltern (nicht nur „die Väter“). Ebenso: *los hermanos* = die Geschwister, *los hijos* = die Kinder.

**Haben oder nicht:** *Tengo dos hermanos.* / *No tengo hijos.*""",
        vocab=[
            ("la familia", "die Familie"), ("el padre", "der Vater"), ("la madre", "die Mutter"), ("los padres", "die Eltern"),
            ("el hermano", "der Bruder"), ("la hermana", "die Schwester"), ("el hijo", "der Sohn"), ("la hija", "die Tochter"),
            ("el abuelo", "der Großvater"), ("la abuela", "die Großmutter"), ("el novio", "der feste Freund"),
            ("la novia", "die feste Freundin"), ("casado", "verheiratet"), ("soltero", "ledig"),
            ("simpático", "nett / sympathisch"), ("mayor", "älter"), ("menor", "jünger"),
        ],
        phrases=[
            ("¿Tienes hermanos?", "Hast du Geschwister?"),
            ("Tengo una hermana mayor y un hermano menor.", "Ich habe eine ältere Schwester und einen jüngeren Bruder."),
            ("Mis padres viven en Colonia.", "Meine Eltern wohnen in Köln."),
            ("Mi madre es profesora.", "Meine Mutter ist Lehrerin."),
            ("No tengo hijos.", "Ich habe keine Kinder."),
            ("¿Estás casado?", "Bist du verheiratet?"),
            ("Mi abuela tiene noventa años.", "Meine Großmutter ist neunzig Jahre alt."),
        ],
        dialogue=[
            ("A", "¿Quién es la chica de la foto?", "Wer ist das Mädchen auf dem Foto?"),
            ("B", "Es mi hermana pequeña, Marta.", "Das ist meine kleine Schwester, Marta."),
            ("A", "¡Qué guapa! ¿Cuántos años tiene?", "Wie hübsch! Wie alt ist sie?"),
            ("B", "Tiene diecinueve años. Estudia en Madrid.", "Sie ist neunzehn. Sie studiert in Madrid."),
            ("A", "¿Y tienes más hermanos?", "Und hast du noch mehr Geschwister?"),
            ("B", "No, solo Marta. ¿Y tú?", "Nein, nur Marta. Und du?"),
            ("A", "Yo tengo dos hermanos mayores.", "Ich habe zwei ältere Brüder."),
        ],
        roleplay="Du zeigst einer spanischen Freundin Fotos von deiner Familie. Die KI stellt Fragen zu deiner Familie: wer, wie alt, wo wohnen sie, was machen sie.",
    ),
    dict(
        id="u06", level="A1", title="In der Stadt: Wo ist …?",
        goal="Du kannst nach dem Weg fragen, Wegbeschreibungen verstehen und sagen, was es wo gibt.",
        grammar="""**estar = sein (für Ort und Zustand)**
estoy, estás, está, estamos, estáis, están
• *¿Dónde está el museo?* = Wo ist das Museum?
• *Estoy cansado.* = Ich bin müde.

**ser oder estar?** *ser* beschreibt, was etwas ist (Identität, Herkunft, Beruf, Eigenschaft). *estar* beschreibt, wo etwas ist und wie es gerade ist.

**hay = es gibt** (immer gleich, für Singular und Plural)
• *¿Hay un supermercado por aquí?* = Gibt es hier in der Nähe einen Supermarkt?
• Mit *hay* steht *un/una* oder gar kein Artikel. Mit *está* steht *el/la*.

**Wegbeschreibung:** *todo recto* (geradeaus), *a la derecha* (rechts), *a la izquierda* (links), *gira* (bieg ab), *sigue* (geh weiter).""",
        vocab=[
            ("la calle", "die Straße"), ("la plaza", "der Platz"), ("la estación", "der Bahnhof"),
            ("el metro", "die U-Bahn"), ("la parada de autobús", "die Bushaltestelle"), ("el banco", "die Bank"),
            ("la farmacia", "die Apotheke"), ("el supermercado", "der Supermarkt"), ("el museo", "das Museum"),
            ("a la derecha", "rechts"), ("a la izquierda", "links"), ("todo recto", "geradeaus"),
            ("cerca", "nah"), ("lejos", "weit weg"), ("al lado de", "neben"), ("enfrente de", "gegenüber von"),
        ],
        phrases=[
            ("Perdona, ¿dónde está la estación?", "Entschuldige, wo ist der Bahnhof?"),
            ("¿Hay una farmacia por aquí?", "Gibt es hier eine Apotheke?"),
            ("Sigue todo recto y gira a la derecha.", "Geh geradeaus und bieg rechts ab."),
            ("Está al lado del banco.", "Sie ist neben der Bank."),
            ("¿Está lejos?", "Ist es weit?"),
            ("No, está a cinco minutos andando.", "Nein, es ist fünf Minuten zu Fuß."),
            ("La segunda calle a la izquierda.", "Die zweite Straße links."),
            ("Estoy perdido.", "Ich habe mich verlaufen."),
        ],
        dialogue=[
            ("A", "Perdone, ¿sabe dónde está el Museo del Prado?", "Entschuldigung, wissen Sie, wo das Prado-Museum ist?"),
            ("B", "Sí, claro. Siga todo recto por esta calle.", "Ja, klar. Gehen Sie diese Straße geradeaus."),
            ("A", "¿Y después?", "Und dann?"),
            ("B", "En la plaza, gire a la izquierda. El museo está enfrente.", "Am Platz biegen Sie links ab. Das Museum ist gegenüber."),
            ("A", "¿Está muy lejos?", "Ist es sehr weit?"),
            ("B", "No, unos diez minutos a pie.", "Nein, ungefähr zehn Minuten zu Fuß."),
            ("A", "Muchas gracias.", "Vielen Dank."),
            ("B", "De nada. ¡Que disfrute!", "Gern geschehen. Viel Spaß!"),
        ],
        roleplay="Du bist in Madrid und hast dich verlaufen. Frag die KI (eine Passantin) nach dem Weg zum Bahnhof Atocha und zu einer Apotheke.",
    ),
    dict(
        id="u07", level="A1", title="Tagesablauf und Uhrzeit",
        goal="Du kannst deinen Alltag beschreiben und Uhrzeiten sagen und verstehen.",
        grammar="""**Reflexive Verben** haben ein Pronomen vor dem Verb:
*levantarse* (aufstehen): **me** levanto, **te** levantas, **se** levanta, **nos** levantamos, **os** levantáis, **se** levantan
Weitere: *ducharse* (duschen), *acostarse* (ins Bett gehen: me acuesto), *despertarse* (aufwachen: me despierto).

**Stammwechsel:** Bei manchen Verben ändert sich der Stamm in betonten Formen: e→ie (*empezar → empiezo*), o→ue (*acostarse → me acuesto*, *volver → vuelvo*). Die Formen mit *nosotros* und *vosotros* bleiben regelmäßig.

**Uhrzeit**
• *¿Qué hora es?* → *Es la una.* / *Son las tres.*
• *y cuarto* (Viertel nach), *y media* (halb, also +30!), *menos cuarto* (Viertel vor)
• *Son las cuatro y media* = 4:30 (nicht „halb vier“ wie im Deutschen!)
• *a las ocho* = um acht""",
        vocab=[
            ("levantarse", "aufstehen"), ("ducharse", "duschen"), ("desayunar", "frühstücken"),
            ("trabajar", "arbeiten"), ("comer", "(zu Mittag) essen"), ("cenar", "zu Abend essen"),
            ("acostarse", "ins Bett gehen"), ("la mañana", "der Morgen / Vormittag"), ("la tarde", "der Nachmittag / frühe Abend"),
            ("la noche", "die Nacht / der Abend"), ("temprano", "früh"), ("tarde", "spät"),
            ("siempre", "immer"), ("a veces", "manchmal"), ("nunca", "nie"), ("la hora", "die Stunde / Uhrzeit"),
        ],
        phrases=[
            ("¿Qué hora es?", "Wie spät ist es?"),
            ("Son las siete y media.", "Es ist halb acht (7:30)."),
            ("Me levanto a las siete.", "Ich stehe um sieben auf."),
            ("Desayuno café y una tostada.", "Ich frühstücke Kaffee und ein Toastbrot."),
            ("Trabajo de nueve a cinco.", "Ich arbeite von neun bis fünf."),
            ("En España se come a las dos.", "In Spanien isst man um zwei zu Mittag."),
            ("Normalmente ceno a las nueve.", "Normalerweise esse ich um neun zu Abend."),
            ("Los domingos me acuesto tarde.", "Sonntags gehe ich spät ins Bett."),
        ],
        dialogue=[
            ("A", "¿A qué hora te levantas normalmente?", "Um wie viel Uhr stehst du normalerweise auf?"),
            ("B", "Entre semana, a las seis y media. ¡Muy temprano!", "Unter der Woche um halb sieben. Sehr früh!"),
            ("A", "Uf, yo me levanto a las ocho.", "Puh, ich stehe um acht auf."),
            ("B", "¿Y a qué hora empiezas a trabajar?", "Und um wie viel Uhr fängst du an zu arbeiten?"),
            ("A", "A las nueve. Y termino a las seis.", "Um neun. Und ich höre um sechs auf."),
            ("B", "¿Y qué haces por la tarde?", "Und was machst du am Abend?"),
            ("A", "Voy al gimnasio y después ceno con mi pareja.", "Ich gehe ins Fitnessstudio und dann esse ich mit meinem Partner zu Abend."),
        ],
        roleplay="Die KI ist eine neue Kollegin aus Barcelona und will wissen, wie dein typischer Tag aussieht. Beschreib deinen Tagesablauf mit Uhrzeiten.",
    ),
    dict(
        id="u08", level="A1", title="Auf dem Markt einkaufen",
        goal="Du kannst Lebensmittel einkaufen, Mengen angeben und nach Preisen fragen.",
        grammar="""**Mengen**
• *un kilo de tomates*, *medio kilo de queso*, *doscientos gramos de jamón*
• *una botella de agua*, *una docena de huevos*, *un paquete de arroz*

**Preis fragen**
• *¿Cuánto cuesta?* = Was kostet das? (eine Sache)
• *¿Cuánto cuestan?* = Was kosten die? (mehrere)
• *¿Cuánto es todo?* = Was macht alles zusammen?

**Demonstrativa**
• *este / esta* = dieser / diese (hier)
• *ese / esa* = der / die da
• *Este queso, por favor.* / *Esas manzanas.*

**Zahlen ab 100:** 200 doscientos, 300 trescientos, 500 quinientos, 1000 mil.""",
        vocab=[
            ("el mercado", "der Markt"), ("la fruta", "das Obst"), ("la verdura", "das Gemüse"),
            ("la manzana", "der Apfel"), ("el plátano", "die Banane"), ("la naranja", "die Orange"),
            ("el tomate", "die Tomate"), ("la patata", "die Kartoffel"), ("la cebolla", "die Zwiebel"),
            ("el pan", "das Brot"), ("los huevos", "die Eier"), ("el pescado", "der Fisch"),
            ("la carne", "das Fleisch"), ("el aceite de oliva", "das Olivenöl"), ("la bolsa", "die Tüte"),
            ("barato", "billig / günstig"),
        ],
        phrases=[
            ("¿Cuánto cuestan los tomates?", "Was kosten die Tomaten?"),
            ("Un kilo de naranjas, por favor.", "Ein Kilo Orangen, bitte."),
            ("Póngame doscientos gramos de jamón.", "Geben Sie mir zweihundert Gramm Schinken."),
            ("¿Me da una bolsa, por favor?", "Geben Sie mir bitte eine Tüte?"),
            ("Estas manzanas están muy buenas.", "Diese Äpfel sind sehr gut."),
            ("¿Algo más? No, eso es todo.", "Sonst noch etwas? Nein, das ist alles."),
            ("¿Cuánto es todo?", "Was macht das alles zusammen?"),
        ],
        dialogue=[
            ("A", "¡Buenos días! ¿Quién es el último?", "Guten Morgen! Wer ist der Letzte (in der Schlange)?"),
            ("B", "Soy yo. Pero ya me toca.", "Ich. Aber ich bin jetzt dran."),
            ("A", "Vale, gracias.", "Okay, danke."),
            ("B", "Hola. ¿A cuánto están las fresas?", "Hallo. Was kosten die Erdbeeren?"),
            ("A", "A cuatro euros el kilo. Están buenísimas.", "Vier Euro das Kilo. Sie sind super lecker."),
            ("B", "Pues medio kilo, por favor. Y una lechuga.", "Dann ein halbes Kilo, bitte. Und einen Salat."),
            ("A", "Aquí tiene. Son tres euros.", "Bitte schön. Das macht drei Euro."),
        ],
        roleplay="Du kaufst auf dem Mercado Central in Valencia ein. Die KI ist die Marktverkäuferin. Kauf Zutaten für eine Tortilla: Eier, Kartoffeln, Zwiebeln, Öl.",
    ),
    dict(
        id="u09", level="A1", title="Hobbys und Vorlieben",
        goal="Du kannst sagen, was du gern machst und was nicht, und andere nach ihren Hobbys fragen.",
        grammar="""**gustar = gefallen**
Im Spanischen sagt man nicht „ich mag Musik“, sondern „mir gefällt Musik“:
• *Me gusta la música.* (eine Sache, Singular)
• *Me gustan los libros.* (mehrere Sachen, Plural: gust**an**)
• *Me gusta leer.* (Tätigkeit: immer *gusta*)

me / te / le / nos / os / les + gusta(n)

**Verstärken:** *Me gusta mucho*, *Me encanta* (ich liebe es), *No me gusta nada* (mag ich gar nicht).
**Zustimmen:** *A mí también.* (Mir auch.) / *A mí tampoco.* (Mir auch nicht.)

**Verben auf -er:** *leer* (lesen): leo, lees, lee, leemos, leéis, leen.""",
        vocab=[
            ("leer", "lesen"), ("escuchar música", "Musik hören"), ("bailar", "tanzen"), ("cocinar", "kochen"),
            ("viajar", "reisen"), ("nadar", "schwimmen"), ("correr", "laufen / joggen"), ("el fútbol", "der Fußball"),
            ("la película", "der Film"), ("la serie", "die Serie"), ("el libro", "das Buch"),
            ("el tiempo libre", "die Freizeit"), ("me encanta", "ich liebe es"), ("odiar", "hassen"),
            ("aburrido", "langweilig"), ("divertido", "lustig / unterhaltsam"),
        ],
        phrases=[
            ("¿Qué haces en tu tiempo libre?", "Was machst du in deiner Freizeit?"),
            ("Me gusta mucho leer.", "Ich lese sehr gern."),
            ("Me encantan las series españolas.", "Ich liebe spanische Serien."),
            ("No me gusta nada el fútbol.", "Fußball mag ich überhaupt nicht."),
            ("¿Te gusta bailar?", "Tanzt du gern?"),
            ("A mí también.", "Mir auch."),
            ("A mí tampoco.", "Mir auch nicht."),
            ("Los fines de semana voy a correr.", "Am Wochenende gehe ich joggen."),
        ],
        dialogue=[
            ("A", "¿Qué te gusta hacer los fines de semana?", "Was machst du gern am Wochenende?"),
            ("B", "Me encanta cocinar para mis amigos. ¿Y a ti?", "Ich liebe es, für meine Freunde zu kochen. Und du?"),
            ("A", "A mí me gusta mucho viajar y hacer senderismo.", "Ich reise sehr gern und gehe wandern."),
            ("B", "¿Te gusta la playa?", "Magst du den Strand?"),
            ("A", "Sí, pero me gusta más la montaña.", "Ja, aber die Berge mag ich lieber."),
            ("B", "¡A mí también! ¿Vamos juntos un día?", "Ich auch! Gehen wir mal zusammen?"),
            ("A", "¡Vale, me parece genial!", "Okay, klingt super!"),
        ],
        roleplay="Ihr lernt euch über eine Tandem-App kennen. Die KI fragt dich nach deinen Hobbys, Lieblingsfilmen und Musik. Frag auch zurück.",
    ),
    dict(
        id="u10", level="A1", title="Verabredungen und Pläne",
        goal="Du kannst Wochentage nennen, dich verabreden und über Pläne sprechen.",
        grammar="""**ir a + Infinitiv = nahe Zukunft** („werden“ / „vorhaben“)
*ir* (gehen): voy, vas, va, vamos, vais, van
• *Voy a cenar con Ana.* = Ich werde mit Ana zu Abend essen.
• *¿Qué vas a hacer el sábado?* = Was machst du am Samstag?

**Wochentage** schreibt man klein. *el lunes* = am Montag, *los lunes* = montags.

**Verabreden**
• *quedar* = sich verabreden: *¿Quedamos el viernes?*
• *¿Te apetece…?* = Hast du Lust auf …?
• *¿Qué tal a las ocho?* = Wie wär's um acht?
• Zusagen: *¡Vale!*, *¡Genial!*, *Perfecto.* Absagen: *Lo siento, no puedo.*

**poder (können), o→ue:** puedo, puedes, puede, podemos, podéis, pueden.""",
        vocab=[
            ("el lunes", "Montag"), ("el martes", "Dienstag"), ("el miércoles", "Mittwoch"), ("el jueves", "Donnerstag"),
            ("el viernes", "Freitag"), ("el sábado", "Samstag"), ("el domingo", "Sonntag"),
            ("el fin de semana", "das Wochenende"), ("hoy", "heute"), ("mañana", "morgen"),
            ("esta noche", "heute Abend"), ("quedar", "sich verabreden / sich treffen"), ("la cita", "die Verabredung / der Termin"),
            ("libre", "frei"), ("ocupado", "beschäftigt"), ("vale", "okay"),
        ],
        phrases=[
            ("¿Qué vas a hacer este fin de semana?", "Was machst du dieses Wochenende?"),
            ("¿Quedamos el viernes por la noche?", "Treffen wir uns Freitagabend?"),
            ("¿Te apetece ir al cine?", "Hast du Lust, ins Kino zu gehen?"),
            ("Lo siento, el sábado no puedo.", "Tut mir leid, am Samstag kann ich nicht."),
            ("¿Qué tal el domingo a las cinco?", "Wie wär's mit Sonntag um fünf?"),
            ("Vale, ¿dónde quedamos?", "Okay, wo treffen wir uns?"),
            ("Voy a visitar a mis padres.", "Ich werde meine Eltern besuchen."),
            ("Te escribo mañana.", "Ich schreibe dir morgen."),
        ],
        dialogue=[
            ("A", "Oye, ¿tienes planes para el sábado?", "Hey, hast du Pläne für Samstag?"),
            ("B", "Por la mañana voy a trabajar, pero por la tarde estoy libre.", "Vormittags arbeite ich, aber nachmittags bin ich frei."),
            ("A", "¿Te apetece tomar algo?", "Hast du Lust, etwas trinken zu gehen?"),
            ("B", "¡Claro! ¿A qué hora quedamos?", "Klar! Um wie viel Uhr treffen wir uns?"),
            ("A", "¿Qué tal a las siete en la Plaza Mayor?", "Wie wär's um sieben an der Plaza Mayor?"),
            ("B", "Perfecto. ¡Nos vemos el sábado!", "Perfekt. Wir sehen uns am Samstag!"),
        ],
        roleplay="Die KI ist ein Freund und will sich mit dir treffen. Einigt euch auf Tag, Uhrzeit, Ort und Aktivität. Lehn einen Vorschlag höflich ab und mach einen eigenen.",
    ),
    dict(
        id="u11", level="A1", title="Wetter und Kleidung",
        goal="Du kannst übers Wetter reden und sagen, was du anziehst.",
        grammar="""**Wetter mit hacer, estar und hay**
• *Hace calor / frío / sol / viento / buen tiempo / mal tiempo.*
• *Está nublado.* = Es ist bewölkt.
• *Llueve.* = Es regnet. *Nieva.* = Es schneit.
• *Hay niebla.* = Es ist neblig.

**Temperatur:** *Estamos a treinta grados.* / *Hace treinta grados.*

**llevar = tragen (Kleidung):** *Llevo una chaqueta.*
**ponerse = anziehen:** *Me pongo el abrigo.* (unregelmäßig: me pongo, te pones, se pone …)

**Farben** passen sich an: *una camiseta roja*, *unos pantalones negros*. Farben auf -e oder Konsonant bleiben gleich: *verde*, *azul*.""",
        vocab=[
            ("el tiempo", "das Wetter / die Zeit"), ("hace calor", "es ist heiß"), ("hace frío", "es ist kalt"),
            ("hace sol", "die Sonne scheint"), ("llueve", "es regnet"), ("nublado", "bewölkt"),
            ("la camiseta", "das T-Shirt"), ("los pantalones", "die Hose"), ("la chaqueta", "die Jacke"),
            ("el abrigo", "der Mantel"), ("el paraguas", "der Regenschirm"), ("rojo", "rot"),
            ("azul", "blau"), ("negro", "schwarz"), ("blanco", "weiß"), ("verde", "grün"),
        ],
        phrases=[
            ("¿Qué tiempo hace hoy?", "Wie ist das Wetter heute?"),
            ("Hace mucho calor en Sevilla.", "In Sevilla ist es sehr heiß."),
            ("Mañana va a llover.", "Morgen wird es regnen."),
            ("Llévate un paraguas.", "Nimm einen Regenschirm mit."),
            ("Estamos a treinta y cinco grados.", "Wir haben fünfunddreißig Grad."),
            ("Hoy llevo una camiseta azul.", "Heute trage ich ein blaues T-Shirt."),
            ("En Alemania hace frío en invierno.", "In Deutschland ist es im Winter kalt."),
        ],
        dialogue=[
            ("A", "¡Qué calor hace hoy!", "Wie heiß es heute ist!"),
            ("B", "Sí, ¡estamos a treinta y ocho grados!", "Ja, wir haben achtunddreißig Grad!"),
            ("A", "En Alemania ahora hace frío y llueve.", "In Deutschland ist es jetzt kalt und es regnet."),
            ("B", "¿Y qué ropa llevas allí en invierno?", "Und was trägst du dort im Winter?"),
            ("A", "Un abrigo, una bufanda y botas.", "Einen Mantel, einen Schal und Stiefel."),
            ("B", "¡Uf! Yo prefiero el sol.", "Puh! Ich bevorzuge die Sonne."),
        ],
        roleplay="Du planst mit der KI einen Ausflug. Sprecht über die Wettervorhersage und überlegt, was ihr anzieht und mitnehmt.",
    ),
    dict(
        id="u12", level="A1", title="Wohnen: Mein Zuhause",
        goal="Du kannst deine Wohnung beschreiben und sagen, wo Dinge sind.",
        grammar="""**hay oder está?**
• *En mi piso hay dos habitaciones.* (Es gibt …: unbestimmt, neue Info)
• *La cocina está al lado del salón.* (Wo ist das Bestimmte?)

**Ortsangaben:** *encima de* (auf / über), *debajo de* (unter), *dentro de* (in), *delante de* (vor), *detrás de* (hinter), *entre* (zwischen).
*de + el = del*: *al lado del sofá*.

**Vergleiche**
• *más grande que* = größer als
• *menos caro que* = weniger teuer als
• *tan grande como* = so groß wie
• Ausnahmen: *mejor* (besser), *peor* (schlechter).""",
        vocab=[
            ("el piso", "die Wohnung (Spanien)"), ("la habitación", "das Zimmer"), ("el dormitorio", "das Schlafzimmer"),
            ("la cocina", "die Küche"), ("el baño", "das Bad"), ("el salón", "das Wohnzimmer"),
            ("la terraza", "die Terrasse / der Balkon"), ("la mesa", "der Tisch"), ("la silla", "der Stuhl"),
            ("la cama", "das Bett"), ("el sofá", "das Sofa"), ("la ventana", "das Fenster"),
            ("el alquiler", "die Miete"), ("grande", "groß"), ("pequeño", "klein"), ("luminoso", "hell"),
        ],
        phrases=[
            ("Vivo en un piso pequeño en el centro.", "Ich wohne in einer kleinen Wohnung im Zentrum."),
            ("Mi piso tiene dos habitaciones.", "Meine Wohnung hat zwei Zimmer."),
            ("La cocina es muy luminosa.", "Die Küche ist sehr hell."),
            ("El sofá está delante de la ventana.", "Das Sofa steht vor dem Fenster."),
            ("Las llaves están encima de la mesa.", "Die Schlüssel liegen auf dem Tisch."),
            ("¿Cuánto pagas de alquiler?", "Wie viel Miete zahlst du?"),
            ("Mi casa es más grande que tu piso.", "Mein Haus ist größer als deine Wohnung."),
        ],
        dialogue=[
            ("A", "¿Qué tal tu piso nuevo?", "Wie ist deine neue Wohnung?"),
            ("B", "¡Me encanta! Es pequeño, pero muy luminoso.", "Ich liebe sie! Sie ist klein, aber sehr hell."),
            ("A", "¿Cuántas habitaciones tiene?", "Wie viele Zimmer hat sie?"),
            ("B", "Dos habitaciones, un baño y una cocina con terraza.", "Zwei Zimmer, ein Bad und eine Küche mit Balkon."),
            ("A", "¿Y está cerca del trabajo?", "Und ist sie nah an der Arbeit?"),
            ("B", "Sí, a diez minutos en bici.", "Ja, zehn Minuten mit dem Fahrrad."),
        ],
        roleplay="Du suchst ein WG-Zimmer in Madrid. Die KI ist der Vermieter. Frag nach Zimmer, Miete, Lage und Mitbewohnern.",
    ),
]
