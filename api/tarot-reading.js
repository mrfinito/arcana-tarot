// Vercel Edge Function: /api/tarot-reading
// Streaming odpowiedzi Claude w czasie rzeczywistym
// Edge runtime ma 60s timeout (free plan) + natywne wsparcie streamingu

export const config = {
  runtime: 'edge'
};

// ============ BAZA KART ============

const cardLibrary = {
  '0. Głupiec': {
    archetype: 'Niewinność, święty głupiec, pielgrzym',
    classical: 'Młodzieniec na krawędzi przepaści, biały pies u nóg, biała róża w dłoni, słońce nad głową. Jeden krok i albo lot, albo upadek.',
    psychological: 'Punkt zero indywiduacji. Moment przed wszystkim. Decyzja niewytłumaczalna logicznie — wewnętrzny imperatyw mówiący "musisz iść".',
    somatic: 'Lekkość w klatce piersiowej, motyle w brzuchu, ale też strach na karku — to ten rodzaj napięcia, które rodzi się, gdy ciało wie więcej niż umysł.',
    question: 'Co byłbyś gotów stracić, żeby zacząć od nowa?',
    reversed: 'Niewinność, która zmieniła się w naiwność. Skok bez sprawdzenia. Ucieczka udająca odwagę.'
  },
  'I. Mag': {
    archetype: 'Twórca, alchemik, hermes',
    classical: 'Mag z różdżką wzniesioną ku niebu, drugą ręką wskazujący ziemię. Na stole cztery żywioły: puchar, miecz, denar, buława. Nieskończoność nad głową.',
    psychological: 'Moment, w którym wewnętrzne talenty stają się dostępne. Świadomość własnej sprawczości. Także: pokusa manipulacji, bo siła kusi do skrótów.',
    somatic: 'Iskra w dłoniach, gorąco w skroniach. Energia, która sama szuka kanału, w którym popłynie.',
    question: 'Czy używasz swojej mocy, czy tylko grasz, że ją masz?',
    reversed: 'Sztukmistrz zamiast Maga. Iluzja sprawczości. Wiara w swoją magię, której nie ma poparcia w działaniu.'
  },
  'II. Wysoka Kapłanka': {
    archetype: 'Strażniczka tajemnicy, czarna Madonna, wewnętrzna wieszczka',
    classical: 'Kobieta między dwoma kolumnami — czarną i białą, Boaz i Jachin. Na kolanach zwój Tory, na głowie korona księżyca. Za nią welon haftowany w granaty.',
    psychological: 'Wiedza, do której nie ma się dostępu rozumem. Sny, intuicja, dolny mózg. Cykliczność kobieca, archetyp Anima. Sprawa, którą zna się ciałem, a nie głową.',
    somatic: 'Cisza w środku brzucha. To miejsce, gdzie wiemy, ale nie umiemy powiedzieć.',
    question: 'Co już wiesz, mimo że jeszcze sobie tego nie powiedziałeś?',
    reversed: 'Intuicja stłumiona, głos wewnętrzny zagłuszony hałasem. Sekrety, które ciążą. Odcięcie od własnej głębi.'
  },
  'III. Cesarzowa': {
    archetype: 'Matka, Demeter, ziemia rodząca',
    classical: 'Kobieta na tronie w pszennym polu, w koronie z dwunastu gwiazd, berło z planety Wenus, suknia w granaty. Cypr i las za nią.',
    psychological: 'Twórczość, płodność (dosłowna i symboliczna — pomysł, projekt, dziecko, książka). Zdolność rodzenia, ale i zdrowego dawania bez pochłaniania.',
    somatic: 'Ciepło w podbrzuszu, miękkość w ramionach, pełnia w klatce piersiowej. Ciało gotowe do dawania.',
    question: 'Co chce się przez Ciebie zrodzić, czego jeszcze nie wpuściłaś do świadomości?',
    reversed: 'Twórczość zablokowana, opieka, która zjada. Matka, która nie odpuszcza. Zależność udająca więź.'
  },
  'IV. Cesarz': {
    archetype: 'Ojciec, struktura, prawodawca',
    classical: 'Władca na tronie z głowami baranów, w zbroi pod purpurową szatą, berło-ankh w dłoni. Góry skaliste za plecami.',
    psychological: 'Zdrowa męska zasada: porządek, granice, odpowiedzialność. Animus dojrzały. Także: ojciec wewnętrzny, ten, który strukturyzuje życie.',
    somatic: 'Stabilność w stopach, prosty kręgosłup, oddech głęboki i miarowy. Postawa, która nie potrzebuje udowadniać.',
    question: 'Gdzie potrzebujesz większej struktury, a gdzie jest jej za dużo?',
    reversed: 'Tyrania, sztywność, kontrola udająca opiekę. Ojciec zimny lub nadmiernie obecny. Granice, które stały się murami.'
  },
  'V. Hierofant': {
    archetype: 'Nauczyciel, kapłan, strażnik tradycji',
    classical: 'Postać w potrójnej tiarze, dwóch klęczących uczniów u stóp, dwa skrzyżowane klucze, dłoń uniesiona w geście błogosławieństwa.',
    psychological: 'Konieczność określenia się wobec tradycji — religii, rodziny, kanonu, autorytetu. Pytanie o własną duchowość. Także: nauczyciel zewnętrzny, mentor.',
    somatic: 'Sztywność w karku, jakby coś trzymało Cię w pozycji, której nie wybierałaś.',
    question: 'Czyje przekonania nosisz jako swoje?',
    reversed: 'Bunt jako tożsamość. Albo: dogmat. Trzymanie się reguł, w które już nie wierzysz.'
  },
  'VI. Kochankowie': {
    archetype: 'Wybór, miłość, integracja przeciwieństw',
    classical: 'Mężczyzna i kobieta nadzy pod aniołem Rafaelem, drzewo wiedzy z wężem za nią, drzewo życia z płomieniami za nim. Słońce nad wszystkim.',
    psychological: 'Pierwszy świadomy wybór wartości. Połączenie z drugą osobą, która lustruje to, co w Tobie. Nie tylko o miłości — o każdej relacji, która wymaga decyzji "tak" lub "nie".',
    somatic: 'Otwartość w klatce piersiowej, ale też niepokój — bo wybór zawsze coś kosztuje.',
    question: 'Czy wybierasz z miłości, czy z lęku przed samotnością?',
    reversed: 'Rozłam wartości, decyzja podjęta pod presją, miłość pomylona z potrzebą.'
  },
  'VII. Rydwan': {
    archetype: 'Wola, zwycięstwo, triumf',
    classical: 'Wojownik w rydwanie ciągniętym przez czarnego i białego sfinksa. Korona z gwiazdą, zbroja z księżycami, baldachim w gwiazdy.',
    psychological: 'Zwycięstwo przez świadome utrzymywanie kierunku mimo przeciwnych sił wewnętrznych. Zdolność trzymania razem sprzeczności i jednak iść.',
    somatic: 'Skupienie w środku piersi, napięcie w ramionach jak u kogoś, kto trzyma lejce. Adrenalina zdrowa, nie panika.',
    question: 'Czy wiesz dokąd jedziesz, czy tylko jedziesz szybko?',
    reversed: 'Rozjeżdżający się rydwan. Wola bez kierunku. Agresja lub bezwład.'
  },
  'VIII. Siła': {
    archetype: 'Odwaga wewnętrzna, oswajanie cienia',
    classical: 'Kobieta delikatnie zamykająca paszczę lwa. Nad głową lemniskata. Wieniec z kwiatów.',
    psychological: 'Siła, która nie dominuje, tylko oswaja. Czułość wobec własnego zwierzęcia wewnętrznego — pożądania, gniewu, instynktu. Praca z cieniem przez akceptację, nie walkę.',
    somatic: 'Spokojny oddech mimo bliskości tego, co dzikie. Miękkość, która ma dno.',
    question: 'Czego w sobie jeszcze nie pogłaskałaś?',
    reversed: 'Wątpienie w siebie, ucieczka przed instynktem albo bunt instynktu przeciw świadomości.'
  },
  'IX. Pustelnik': {
    archetype: 'Mędrzec, samotnik, ten kto wie',
    classical: 'Stary mężczyzna z latarnią, w której świeci sześcioramienna gwiazda. Sam na szczycie góry, owinięty szarym płaszczem.',
    psychological: 'Konieczność wycofania się z hałasu, żeby usłyszeć siebie. Czas samotności nie jako kary, ale jako warunku poznania. Także: spotkanie ze starym mędrcem w sobie.',
    somatic: 'Cisza w skroniach, oddech wolny, ciało które przestaje gonić.',
    question: 'Co usłyszysz, kiedy wreszcie zaczniesz milczeć?',
    reversed: 'Izolacja zamiast samotności. Odcięcie udające mądrość. Ucieczka przed światem.'
  },
  'X. Koło Fortuny': {
    archetype: 'Cykl, los, koło istnienia',
    classical: 'Wielkie koło z literami TARO/ROTA, w rogach cztery istoty (anioł, orzeł, lew, wół), na kole anubis i tyfon, na szczycie sfinks z mieczem.',
    psychological: 'Punkt zwrotny, w którym los gra Twoją kartą bez pytania o zgodę. Nieosobowa siła zmiany. Coś się kończy i coś zaczyna jednocześnie.',
    somatic: 'Zawrót głowy, lekkie drżenie. Ciało wie, że grunt się rusza.',
    question: 'Czy próbujesz zatrzymać koło, czy uczysz się jechać razem z nim?',
    reversed: 'Opór wobec nieuchronnego. Przekonanie, że "mnie się to nie zdarzy". Stagnacja udająca stabilność.'
  },
  'XI. Sprawiedliwość': {
    archetype: 'Prawda, równowaga, karma',
    classical: 'Postać na tronie z mieczem wzniesionym pionowo i wagą w drugiej dłoni. Czerwona szata, korona z kwadratem, fioletowy welon za plecami.',
    psychological: 'Konfrontacja z konsekwencjami własnych wyborów. Czas rozliczenia z samym sobą. Karma rozumiana jako prawo przyczyny i skutku, nie kara.',
    somatic: 'Wyprostowanie kręgosłupa, czystość oddechu. To stan, gdy nie ma już co ukrywać.',
    question: 'Czy jesteś gotów żyć z konsekwencjami tego, kim naprawdę jesteś?',
    reversed: 'Niesprawiedliwość, której ofiarą jesteś — albo którą sam wyrządziłeś. Unikanie odpowiedzialności.'
  },
  'XII. Wisielec': {
    archetype: 'Poświęcenie, pauza, odwrócona perspektywa',
    classical: 'Mężczyzna zawieszony za jedną nogę na drzewie w kształcie T, druga noga założona, aureola wokół głowy.',
    psychological: 'Świadome zatrzymanie się. Akceptacja, że nie wszystko da się rozwiązać działaniem. Czasem trzeba zawisnąć — żeby świat się obrócił, nie Ty. Inicjacja.',
    somatic: 'Dziwna ulga w napięciu, jakby ciało zgodziło się przestać walczyć.',
    question: 'Co zobaczysz, jeśli na chwilę przestaniesz coś z tym robić?',
    reversed: 'Pauza, która stała się prokrastynacją. Bierność udająca głębię. Strach przed ruchem.'
  },
  'XIII. Śmierć': {
    archetype: 'Transformacja, koniec rozdziału, śmierć symboliczna',
    classical: 'Szkielet w czarnej zbroi na białym koniu, w dłoni czarna chorągiew z białą różą. Na ziemi król, dziecko, kobieta i biskup. W tle wschód słońca między dwiema wieżami.',
    psychological: 'Coś musi umrzeć, żeby coś mogło się narodzić. Nie fizyczna śmierć — śmierć tożsamości, relacji, etapu, iluzji. Najtrudniejsza i najbardziej wyzwalająca karta tarota.',
    somatic: 'Ciężar w piersi, ale też dziwny spokój. Ciało wie, że trzeba puścić.',
    question: 'Czego trzymasz się, mimo że już dawno się skończyło?',
    reversed: 'Opór przed pożegnaniem. Trzymanie się tego, co martwe. Lęk paraliżujący proces.'
  },
  'XIV. Umiarkowanie': {
    archetype: 'Integracja, alchemia, anioł równowagi',
    classical: 'Anioł z jedną nogą w wodzie, drugą na lądzie, przelewający wodę z jednego naczynia do drugiego. Na piersi trójkąt w kwadracie. Droga prowadząca do gór i korony.',
    psychological: 'Świadoma praca nad łączeniem przeciwieństw w sobie. Ciało i duch, działanie i bierność, męskie i kobiece. To długi proces, nie błysk.',
    somatic: 'Równy oddech, ciepło bez gorączki, chłód bez sztywności. Stan środka.',
    question: 'Co próbujesz w sobie wymusić, zamiast zintegrować?',
    reversed: 'Brak równowagi, ekstremum. Albo wieczne ekscesy, albo paraliż w środku. Niecierpliwość wobec procesu.'
  },
  'XV. Diabeł': {
    archetype: 'Cień, uzależnienie, niewidzialne więzy',
    classical: 'Rogata postać na piedestale, dwoje nagich ludzi przykutych łańcuchami — ale łańcuchy są luźne, mogliby je zdjąć. Pochodnia w odwróconej dłoni.',
    psychological: 'Spotkanie z własnym cieniem — częścią, którą wypierasz, ale która rządzi Twoim życiem. Uzależnienia, kompulsje, schematy. Łańcuchy są luźne — ale wierzysz, że nie.',
    somatic: 'Ciężar w żołądku, ciało napięte, jakby ktoś trzymał za gardło. Często towarzyszy temu wstyd.',
    question: 'Czyje łańcuchy nosisz, w które nawet nikt cię nie zakuwał?',
    reversed: 'Moment, w którym widzisz luźność łańcuchów. Przebudzenie. Wyzwolenie zaczyna się od wglądu.'
  },
  'XVI. Wieża': {
    archetype: 'Kryzys, olśnienie, runięcie fałszywych konstrukcji',
    classical: 'Wieża rażona piorunem, korona spadająca ze szczytu, dwie postaci wypadające z okien, płomienie. W tle ciemne niebo.',
    psychological: 'Coś, co zbudowałeś na piasku, się rozpada — i to dobrze, choć boli. Iluzja, fałszywe ego, struktura nie do utrzymania. Wieża zawsze burzy to, co powinno paść.',
    somatic: 'Szok, drżenie, czasem mdłości. Ciało wie, że ziemia się zatrzęsła, zanim umysł to przyzna.',
    question: 'Co próbujesz utrzymać, choć już wiesz, że nie utrzyma się samo?',
    reversed: 'Odsuwanie nieuniknionego. Zamykanie oczu na pęknięcia, które już są.'
  },
  'XVII. Gwiazda': {
    archetype: 'Nadzieja, odnowa, łaska',
    classical: 'Naga kobieta klęcząca nad sadzawką, jedną stopą w wodzie, drugą na lądzie. Przelewa wodę z dwóch dzbanów. Nad nią siedem gwiazd, jedna wielka pośrodku.',
    psychological: 'Po Wieży przychodzi Gwiazda. Cicha nadzieja po katastrofie. Odzyskane zaufanie, ale już nie naiwne — przeszło przez ogień. Łaska, którą trzeba przyjąć nago.',
    somatic: 'Łzy bez bólu, otwarte gardło, lekkość. Ciało, które wreszcie odpoczywa.',
    question: 'Czy potrafisz przyjąć dobro, nie próbując sobie wytłumaczyć skąd się wzięło?',
    reversed: 'Zwątpienie po stracie. Niewiara, że może być inaczej. Cynizm jako tarcza.'
  },
  'XVIII. Księżyc': {
    archetype: 'Sen, lęk, świat podświadomy',
    classical: 'Pełnia księżyca między dwiema wieżami. Pies i wilk wyją w stronę księżyca, rak wychodzi z wody. Kropelki spadają z księżyca jak deszcz.',
    psychological: 'Wejście w głąb własnej psychiki — sny, lęki, projekcje. Granica między tym co realne i tym co wyobrażone się zaciera. Czasem czas kryzysu psychicznego.',
    somatic: 'Niepokój bez nazwy, sny intensywne, ciało reagujące na to, czego umysł nie nazwał.',
    question: 'Czyje to jest naprawdę lęki — Twoje czy odziedziczone?',
    reversed: 'Rozproszenie strachu, wyjście z mgły, świtanie. Ale też: powierzchowne wyparcie tego, co głębsze.'
  },
  'XIX. Słońce': {
    archetype: 'Radość, witalność, pełnia',
    classical: 'Nagie dziecko na białym koniu, z czerwonym sztandarem. Słonecznik za nim, mur, wielkie słońce z 12 promieniami.',
    psychological: 'Świadomość, która wreszcie wyszła z cienia. Radość niewinna jak u dziecka, ale po przeprawie. Sukces nie tylko zewnętrzny — przede wszystkim wewnętrzny.',
    somatic: 'Ciepło w klatce, uśmiech sam się robi, szybkość kroku.',
    question: 'Czy potrafisz cieszyć się tak, żeby nie szukać już powodu, dla którego nie zasługujesz?',
    reversed: 'Radość, która brzmi cienko. Optymizm jako maska. Też: spóźniona radość.'
  },
  'XX. Sąd': {
    archetype: 'Przebudzenie, powołanie, rozliczenie',
    classical: 'Archanioł Gabriel trąbiący nad otwartymi grobami. Z grobów wstają nadzy ludzie z rękami wzniesionymi w geście "tak". Białe góry w tle.',
    psychological: 'Wezwanie. Coś w Tobie się budzi i wie, że nie może już udawać, że nie słyszało. Rozliczenie się z dotychczasowym życiem. Drugie życie w pierwszym.',
    somatic: 'Dreszcz, łzy bez powodu, uczucie że ktoś Cię woła po imieniu — choć nie wiesz kto.',
    question: 'Czego Twoja dusza nie chce już udawać, że tego nie chce?',
    reversed: 'Samokrytyka, niezdolność do przyjęcia powołania, lęk przed odpowiedzialnością za swój głos.'
  },
  'XXI. Świat': {
    archetype: 'Spełnienie, integracja, koniec cyklu',
    classical: 'Tańcząca naga postać w fioletowym welonie, dwie różdżki w dłoniach, w wieńcu laurowym. W rogach cztery istoty: anioł, orzeł, lew, wół.',
    psychological: 'Pełnia po długiej podróży. Indywiduacja zakończona — przynajmniej w tym cyklu. Człowiek, który zintegrował cztery żywioły w sobie. Tańczy, bo wreszcie może.',
    somatic: 'Pełnia w całym ciele, oddech głęboki, ruch lekki. Ciało wie, że dotarło.',
    question: 'Co teraz, gdy się skończyło? Bo każde Świat to też nowy Głupiec.',
    reversed: 'Niedokończona sprawa, ostatni krok nieprzeszedł. Coś czeka na domknięcie.'
  }
};

const suitsDeep = {
  'Kielichy': { element: 'Woda', domain: 'Emocje, relacje, intuicja, miłość, sztuka', energy: 'Płynna, intuicyjna, kobieca, wrażliwa', body: 'Klatka piersiowa, serce, gardło' },
  'Pentakle': { element: 'Ziemia', domain: 'Praca, pieniądze, ciało, materia, rzemiosło', energy: 'Stała, konkretna, cierpliwa, somatyczna', body: 'Stopy, brzuch, ręce, kręgosłup' },
  'Miecze': { element: 'Powietrze', domain: 'Myśli, słowa, konflikty, prawda, decyzje', energy: 'Ostra, klarowna, czasem tnąca, intelektualna', body: 'Głowa, gardło, szczęka' },
  'Buławy': { element: 'Ogień', domain: 'Pasja, działanie, twórczość, wola, droga', energy: 'Dynamiczna, męska, twórcza, impulsywna', body: 'Splot słoneczny, podbrzusze, dłonie' }
};

const ranksDeep = {
  'As': { meaning: 'Czysty potencjał żywiołu, iskra, dar', reversed: 'Potencjał uśpiony lub zmarnowany' },
  'II': { meaning: 'Pierwszy wybór, dualność, partnerstwo', reversed: 'Niezdecydowanie, fałszywa równowaga' },
  'III': { meaning: 'Wzrost, manifestacja, pierwsze owoce', reversed: 'Zazdrość, niezgoda, blokada w rozwoju' },
  'IV': { meaning: 'Stabilność, fundament, ale i stagnacja', reversed: 'Zastój, opór wobec ruchu' },
  'V': { meaning: 'Kryzys, próba, strata, konflikt', reversed: 'Wyjście z kryzysu, lekcja przyswojona' },
  'VI': { meaning: 'Harmonia, dawanie i branie, nostalgia', reversed: 'Utknięcie w przeszłości, niewdzięczność' },
  'VII': { meaning: 'Refleksja, wybór wśród opcji, czasem iluzje', reversed: 'Ucieczka, samooszukiwanie' },
  'VIII': { meaning: 'Ruch, mistrzostwo, dyscyplina', reversed: 'Utknięcie, brak progresji' },
  'IX': { meaning: 'Spełnienie, dojrzałość, niezależność', reversed: 'Niedosyt, samotność, przesyt' },
  'X': { meaning: 'Kulminacja, dziedzictwo, koniec cyklu', reversed: 'Ciężar nadmierny, niepotrzebne brzemię' },
  'Paź': { meaning: 'Wiadomość, ciekawość, młody umysł', reversed: 'Niedojrzałość, plotka, plotkarstwo' },
  'Rycerz': { meaning: 'Działanie, impet, droga', reversed: 'Pośpiech lub ociąganie, brak balansu' },
  'Królowa': { meaning: 'Dojrzałość żywiołu, czułość mistrzowska', reversed: 'Cień żywiołu — nadmiar emocji/kontroli/twardości' },
  'Król': { meaning: 'Mistrzostwo, autorytet, dojrzałe panowanie', reversed: 'Tyrania, dystans, sztywność' }
};

function getMinorCardData(name) {
  const parts = name.split(' ');
  const rank = parts[0];
  const suitWord = parts.slice(1).join(' ');
  let suit = null;
  if (suitWord.startsWith('Kielich')) suit = 'Kielichy';
  else if (suitWord.startsWith('Pentakl')) suit = 'Pentakle';
  else if (suitWord.startsWith('Miecz')) suit = 'Miecze';
  else if (suitWord.startsWith('Buław')) suit = 'Buławy';
  if (!suit || !ranksDeep[rank]) return null;
  const s = suitsDeep[suit];
  const r = ranksDeep[rank];
  return {
    archetype: rank + ' ' + suit + ' — ' + r.meaning,
    classical: 'Karta ' + suit.toLowerCase() + ' (żywioł ' + s.element + '). Obszar: ' + s.domain + '.',
    psychological: r.meaning + '. W kontekście ' + s.domain.toLowerCase() + '. Energia ' + s.energy.toLowerCase() + '.',
    somatic: 'Czuje się w okolicach: ' + s.body + '.',
    question: 'Co ta karta otwiera w obszarze ' + s.domain.toLowerCase() + '?',
    reversed: r.reversed
  };
}

function buildCardDossier(cardName, reversed) {
  let data = cardLibrary[cardName];
  if (!data) data = getMinorCardData(cardName);
  if (!data) return cardName + ' (' + (reversed ? 'odwrócona' : 'prosta') + ')';
  let d = '═══ ' + cardName + ' (' + (reversed ? 'ODWRÓCONA' : 'prosta') + ') ═══\n';
  d += 'ARCHETYP: ' + data.archetype + '\n';
  d += 'SYMBOLIKA: ' + data.classical + '\n';
  d += 'PSYCHOLOGICZNIE: ' + data.psychological + '\n';
  d += 'SOMATYCZNIE: ' + data.somatic + '\n';
  d += 'PYTANIE: ' + data.question + '\n';
  if (reversed) d += 'W ODWRÓCENIU: ' + data.reversed + '\n';
  return d;
}

// ============ EDGE HANDLER ============

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { spreadName, question, cards } = body;
  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    return new Response(JSON.stringify({ error: 'Brakuje danych o kartach' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Brak klucza API w konfiguracji' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const cardDossiers = cards.map(c =>
    'POZYCJA "' + c.position + '":\n' + buildCardDossier(c.name, c.reversed)
  ).join('\n\n');

  const systemPrompt = `Jesteś Liwią — tarocistką z 20-letnim stażem. Pracujesz w gabinecie na warszawskim Mokotowie, do którego ludzie przychodzą po głębokie, mądre odczytanie, nie po szybką wróżbę. Ukończyłaś studia z psychologii, ale w pracy z kartami nie jesteś psychoterapeutką — jesteś czytelniczką symboli, która rozumie duszę przez archetypy, sny, mit i intuicję. Czytasz tarot Marsylski i Rider-Waite od dwudziestu lat.

═══════════════════════════════
TWÓJ JĘZYK — TO NAJWAŻNIEJSZE
═══════════════════════════════

Piszesz NATURALNĄ, BOGATĄ POLSZCZYZNĄ. Twoje zdania nie są krótkie i lakoniczne — są pełne, plastyczne, czasem długie, z dygresjami, z półtonem.

PRZYKŁADY TWOJEGO STYLU:

❌ ŻLE: "Ta karta oznacza, że czeka cię zmiana. Bądź gotów na nowe wyzwania. Słuchaj swojej intuicji."

✓ DOBRZE: "Wisielec w tej pozycji nie zapowiada cierpienia — zapowiada coś trudniejszego: konieczność, żeby przestać się szarpać. Patrzę na niego i widzę, że Ty już od kilku tygodni próbujesz wymyślić, jak to rozwiązać, jak zaplanować, jak działaniem wyjść z impasu. A karta mówi: powieś się na chwilę głową w dół. Niedosłownie — chodzi o to, żeby zobaczyć tę sprawę z zupełnie innej strony niż wszystkie te, z których ją oglądałaś. Coś, co teraz uważasz za problem, z innej perspektywy może okazać się darem."

PISZ JAK PISARKA. Używaj długich zdań na przemian z krótkimi, półdygresji, konkretnych obrazów, pauz, czasem pytań retorycznych.

═══════════════════════════════
CZEGO NIE WOLNO PISAĆ
═══════════════════════════════

ZAKAZANE zwroty:
- "Pamiętaj, że..." / "Warto pamiętać..." / "Bądź gotów/gotowa..."
- "Słuchaj swojej intuicji" / "Zaufaj wszechświatowi"
- "Karta ta symbolizuje/oznacza/wskazuje..."
- "Energia tej karty jest..."
- "W tej sytuacji..." / "Należy/trzeba..."
- "Jako tarocistka uważam..." / "W tarocie..."
- Słowa "wibracja", "energia" więcej niż 2 razy w całym tekście

═══════════════════════════════
STRUKTURA (zachowaj nagłówki w **markdown**)
═══════════════════════════════

**Energia rozkładu**
5-7 zdań. Wejdź konkretnie. Co rzuca się w oczy. Żywioły, dominacja Wielkich/Małych Arkanów, odwrócone karty.

**[Pozycja: nazwa karty]**
Powtórz dla KAŻDEJ karty. 8-12 zdań. Wejście obrazem, funkcja w pozycji, co to znaczy dla pytającego, wątek głębszy (archetyp/mit), cielesność, konkret.

**Co karty mówią razem**
7-10 zdań. Najważniejsza sekcja. Jak karty rozmawiają, oś czasowa, główna opowieść pod powierzchnią pytania.

**Twoja praca na najbliższy czas**
4-5 ponumerowanych KONKRETNYCH rekomendacji. Nie "zadbaj o siebie", tylko np. "Przed każdą decyzją w tej sprawie połóż dłoń na splocie słonecznym i zapytaj ciało, czy to TAK."

**Słowo na koniec**
3-4 zdania osobistego pożegnania.

═══════════════════════════════
DŁUGOŚĆ
═══════════════════════════════

CAŁOŚĆ 1500-2000 SŁÓW. Lepiej dłużej niż krócej. Każde zdanie niesie coś nowego.

JĘZYK POLSKI staranny: sprawdzaj odmianę, różnicuj długość zdań, unikaj kalek z angielskiego, nie nadużywaj "się".`;

  const userPrompt = `Rozkład: ${spreadName}
${question ? 'Pytanie pytającego: „' + question + '"' : 'Pytający nie zadał konkretnego pytania — wyczuj z konstelacji kart, o czym jest dziś jego życie.'}

KARTY Z PEŁNYM KONTEKSTEM:

${cardDossiers}

Zinterpretuj ten rozkład tak, jak robisz to w swoim gabinecie — głęboko, plastycznie, językiem żywym, bez frazesów. 1500-2000 słów. Każda karta zasługuje na 8-12 zdań własnych.`;

  // Wywołujemy Anthropic API w trybie streaming
  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4500,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!anthropicResponse.ok) {
    const errText = await anthropicResponse.text();
    return new Response(
      JSON.stringify({ error: 'Błąd API Anthropic (' + anthropicResponse.status + '): ' + errText.slice(0, 500) }),
      { status: anthropicResponse.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parsujemy SSE z Anthropic i przekazujemy czysty tekst do klienta
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicResponse.body.getReader();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch (e) {
                // pomijamy nieparsowalne linie
              }
            }
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no'
    }
  });
}
