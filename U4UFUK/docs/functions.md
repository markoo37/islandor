# Islandors – Függvénylista és Dokumentáció

Ez a dokumentum a játékban található összes JavaScript/jQuery függvény rövid leírását tartalmazza, kategóriákra bontva.

---

## 1. Hangok és Effektek

* **`playSound(kind)`**: Lejátssza a megadott típusú hangeffektet (mozgás, támadás, spawn stb.) előre beállított hangerővel, a hangfájl elejéről indítva.
* **`playAttackSound(attacker)`**: Lejátssza a megfelelő harci hangot az egység típusa szerint (katonának kardcsapás, felderítőnek mágia).

---

## 2. Koordináta és Pozíció Segédek

* **`cellIndex(x, y)`**: Átváltja a 2D-s ($x, y$) koordinátát egy egydimenziós sorszámmá ($0$-tól $35$-ig) a HTML rácshoz szükséges indexeléshez.
* **`cellKey(x, y)`**: Egy `"x,y"` formátumú szöveges kulcsot gyárt a koordinátákból, amit a látogatott mezők megjegyzéséhez használ a kód.
* **`inBounds(x, y)`**: Ellenőrzi, hogy a megadott koordináta rajta van-e a $6 \times 6$-os játéktáblán.
* **`getBasePos(player)`**: Visszaadja az adott játékos bázisának fix koordinátáját (Piros: bal felül `[0,0]`, Kék: jobb alul `[5,5]`).
* **`getEnemyBasePos(player)`**: Visszaadja az ellenfél bázisának koordinátáját.

---

## 3. Játékos és Egység Adatlekérők

* **`getPlayerData(p)`**: Lekéri az adott játékos aktuális adatait (nyersanyagok száma, bázis élete).
* **`otherPlayer(p)`**: Visszaadja az ellentétes játékos színét (ha pirosat kap, kéket ad, és fordítva).
* **`playerLabel(p)`**: Magyar nyelvű szöveges címkét ad vissza a játékos színéhez ("Piros" vagy "Kék").
* **`getUnitInfo(type)`**: Lekéri az adott egységtípus alapvető statisztikáit (életpont, sebzés, árak, emojik).
* **`getAttackDamage(attacker)`**: Visszaadja a támadó egység típusához tartozó sebzési értéket.
* **`$cellAt(x, y)`**: Megkeresi és visszaadja a megadott koordinátájú konkrét HTML cellát (jQuery objektumként) a rácsból az `.eq()` segítségével.
* **`getUnitById(id)`**: Egyedi azonosító alapján megkeres egy konkrét egységet a globális egységlistából.
* **`getSelectedUnit()`**: Visszaadja a játékos által éppen kijelölt egység objektumát.
* **`getTurnSecFromConfig()`**: Kiolvassa a beállítások legördülő menüjéből, hogy hány másodpercesek legyenek a körök.
* **`getUnitAt(x, y)`**: Megnézi, hogy áll-e egység a megadott ($x, y$) koordinátán, és ha igen, visszaadja azt.
* **`countUnits(player)`**: Megszámolja, hány darab egysége van életben az adott játékosnak a pályán.

---

## 4. Bázis és Győzelmi Logika

* **`clampBaseHpValue(hp)`**: Biztosítja, hogy a bázis életpontja számmá alakítható legyen, és ne eshessen $0$ alá.
* **`normalizeBaseHp()`**: Mindkét játékos bázisának életpontját ellenőrzi és normalizálja a `clampBaseHpValue` segítségével.
* **`getVictoryInfo()`**: Ellenőrzi a győzelmi feltételeket (meghalt-e egy bázis, vagy elfogytak-e valaki egységei), és visszaadja a győztest, a vesztest és az okot.
* **`gameEndStatusText(info)`**: Legyártja a játék alján megjelenő státuszsor szövegét a győzelem oka alapján.
* **`gameEndAlertText(info)`**: Legyártja a felugró ablakban (`alert`) megjelenő részletes, sortörésekkel elválasztott győzelmi szöveget.
* **`clearGameEndState()`**: Visszaállítja a felületet normál állapotba, eltávolítva a játék végi győzelmi/vereségi CSS osztályokat a törzsről és a panelekről.
* **`announceGameEnd(winner, options)`**: Leállítja az időzítőt, kiszínezi az oldalsó paneleket a győztes/vesztes szerint, frissíti a táblát, és ha nem "néma" módban van, feldobja a végső felugró üzenetet.
* **`victoryStatusText(winner, fullMessage)`**: Segédszöveget generál a győzelmi jelentéshez (az aktuális kód szerint részben alternatív szöveggyártó).
* **`checkVictory()`**: Gyors ellenőrzés, ami visszaadja a győztes színét, ha már véget ért a játék, különben `null`-t ad.

---

## 5. Lépegetés és Támadás Logika

* **`isEnemyBaseCell(x, y, myPlayer)`**: Megmondja, hogy a kiválasztott cella az ellenség bázisa-e.
* **`isOwnBaseCell(x, y, myPlayer)`**: Megmondja, hogy a kiválasztott cella a saját bázisunk-e.
* **`canWalkOnto(x, y, myPlayer)`**: Eldönti, hogy szabad-e a mező (rá lehet-e lépni): ellenőrzi, hogy nem az ellenség bázisa-e, és hogy nem áll-e rajta másik egység.
* **`manhattan(ax, ay, bx, by)`**: Kiszámolja két mező közötti rácstávolságot (Manhattan-távolság) az abszolút értékek összegeként.
* **`getMoveRange(unit)`**: Visszaadja az adott egység maximális lépéstartományát.
* **`getReachableCells(unit)`**: BFS (szélességi) kereséssel, lépésről lépésre kiszámolja az összes olyan mezőt, ahová az egység az akadályokat kikerülve el tud jutni a lépési tartományán belül.
* **`isAdjacent(ax, ay, bx, by)`**: Megmondja, hogy két mező közvetlenül szomszédos-e (alatta, felette vagy mellette van-e, azaz a távolságuk pontosan 1).
* **`isMoveValid(unit, tx, ty)`**: Ellenőrzi, hogy az egység cselekedett-e már a körben, és hogy a célmező szerepel-e az elérhető mezői között.
* **`applyMoveResult(unit, tx, ty)`**: Végrehajtja a pozícióváltást a háttérben: átírja a koordinátákat, elhasználtra állítja az egységet, és ha a Bányász nyersanyagra lépett, hozzáadja azt a raktárhoz, a mezőt pedig kiüríti.
* **`tryAttackBase(attacker, tx, ty)`**: Megpróbálja megsebezni az ellenséges bázist. Ellenőrzi, hogy az egység képes-e támadni, mellette áll-e és van-e még akciója, majd levonja a bázis életét és lejátssza a hangot.
* **`tryAttackUnit(attacker, target)`**: Végrehajtja az egységek közötti harcot, levonja a HP-t, elhasználja a támadó akcióját, és ha a célpont meghalt, törli azt a játékból.

---

## 6. Időzítők és Körök Kezelése

* **`stopTurnTimer()`**: Leállítja és törli a folyamatban lévő köridő-számláló intervallumot, valamint leveszi a kritikus időre figyelmeztető CSS osztályt.
* **`startTurnTimer()`**: Elindítja a köridő visszaszámlálást: másodpercenként csökkenti az időt, 10 másodperc alatt pirosra színezi a kijelzőt, $0$-nál pedig automatikusan lezárja a kört.
* **`trySpawnCenterResource()`**: Tesz maximum 24 próbálkozást, hogy a pálya előre meghatározott középső/központi területein egy véletlenszerűen kiválasztott üres, egységmentes mezőre fát vagy aranyat rakjon le.
* **`endTurn()`**: Lezárja az aktuális kört: nullázza a kijelölést, minden 4. körben nyersanyagot spawnol a központban, átadja a kört a másik játékosnak, és aktiválja az egységek akciópontjait a következő körre.

---

## 7. Megjelenítés (Rendering) és Animáció

* **`pulseUnitCell(x, y)`**: Finom kis áttetszőségi villanással (jQuery `.animate()`) jelzi a képernyőn a katona dobozán, ha az sikeresen cselekedett (támadott vagy lépett).
* **`animateUnitMove(unit, tx, ty, onDone)`**: Elrejti az igazi katonát, lemásolja a grafikáját, majd egy fixen pozicionált lebegő rétegen pixelpontosan átúsztatja a célcellára, ahol a megérkezéskor végrehajtja a tényleges mozgásbejegyzést.
* **`updatePanels()`**: Frissíti a képernyő két szélén lévő paneleket: kiírja a fát, az aranyat, a bázis HP-kat, és megvilágítja annak a panelét, aki éppen következik.
* **`terrainClass(t)`**: Egy egyszerű szótárból visszaadja a tereptípushoz (pl. arany, fa, bázisok) tartozó CSS osztálynevet.
* **`terrainBlockHtml(t)`**: Visszaadja a tereptárgyhoz tartozó HTML sablont (ikon emojik és feliratok szövege).
* **`renderBoard()`**: Teljesen letörli, majd újra felépíti a HTML táblát a háttéradatok alapján: kirajzolja a terepet, az egységek kártyáit, a kijelölést, valamint a zöld mozgási tippeket és a piros támadási célpontokat.

---

## 8. Felhasználói Interakció, Mentés és Menü

* **`onCellClick(x, y)`**: A játék központi agya kattintáskor: lekezeli, hogy a kattintott cella alapján egységet jelölünk ki, ellenséges egységet vagy bázist támadunk, vagy üres mezőre lépünk az animáció segítségével.
* **`saveGame()`**: Egyetlen JSON szöveggé csomagolja be a játékállást (`gameState`, kijelölt egység, következő egység ID), és elmenti a böngésző tartós memóriájába (`localStorage`).
* **`loadGame()`**: Beolvassa a mentett JSON szöveget, ellenőrzi, hogy a mentés kompatibilis-e a $6 \times 6$-os táblamérettel, majd teljesen visszaállítja a játékot, a témát és a köridőzítőt.
* **`toggleTheme()`**: Vált a világos és a sötét vizuális téma között a `<body>` osztályainak cseréjével és elmenti a választást a játékállapotba.
* **`findSpawnCell(player)`**: Keres egy szabad, érvényes szomszédos (akár átlós) mezőt a játékos bázisa körül, ahová az új egységet le lehet rakni építéskor.
* **`makeUnit(type, player, x, y)`**: Legyárt és visszaad egy új egység-objektumot az alapértelmezett statisztikáival, pozíciójával és egy egyedi futó azonosító számmal (`nextUnitId`).
* **`buildUnit(type)`**: Ellenőrzi, hogy van-e elég nyersanyag és szabad hely a bázis körül, levonja az árat, majd a bázis mellé építi (beszúrja a listába) a kért egységet.
* **`initGame()`**: Teljesen új játékot indít: nullázza az ID-kat, üres pályát hoz létre, kisorsol egy nyersanyag-elrendezést (pályamagot), lehelyezi a kezdőcsapatokat (1-1 bányász és katona oldalanként) és elindítja az időzítőt.
* **`getBgMusic()`**: Lekéri a háttérzene HTML `<audio>` elemét ID alapján.
* **`startBgMusic()`**: Elindítja a háttérzenét $35\%$-os hangerővel, ha a böngésző nem blokkolja azt.
* **`stopBgMusic()`**: Megállítja a háttérzenét és visszatekeri a legelejére.
* **`showStartScreen()`**: Leállítja a játékot és a zenét, majd elhalványítással megjeleníti a főmenüt (kezdőképernyőt).
* **`dismissStartScreen(callback)`**: Animációval eltünteti a főmenüt, átvált aktív játékmenetre, majd meghívja az indításért felelős függvényt.
* **`beginNewGameFromMenu()`**: Eltünteti a menüt és teljesen új játékot indít el.
* **`beginLoadFromMenu()`**: Ellenőrzi a mentés meglétét, eltünteti a menüt és betölti a legutóbbi mentést.