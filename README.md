# Islandors

Egyszerű, **két játékosos**, **körökre osztott** stratégiai játék ugyanazon a gépen. A kód **HTML, CSS, JavaScript és jQuery** (jQuery UI a súgó ablakhoz). A futtatható verzió a **`U4UFUK`** mappában van: nyisd meg a **`U4UFUK/index.html`** fájlt böngészőben.

## Mi a játék?

- **Pálya:** 8×8 négyzetrács. Mindkét játékosnak van egy **bázisa** (piros: bal felső, kék: jobb alsó sarok).
- **Nyersanyagok:** a pályán sok **fa** (erdő) és **arany** mező van; a **bányász** rálépéskor **+3 fa** vagy **+3 arany** gyűjtést kap (a mező kiürül). Kezdéskor mindkét játékosnak **6 fa és 6 arany** jár.
- **Egységek:**
  - **Bányász (B):** gyűjtés; egy mezőt lép körbenként (négy irány).
  - **Katona (K):** harc; egy mezőt lép; **2 sebzés** szomszédos ellenségre vagy ellenséges bázisra.
  - **Felderítő (F):** **legfeljebb 2 mezőt** léphet egy körben (négy irány, szabad úton); **1 sebzés**; **nem gyűjt**; kevesebb életereje van.
- **Győzelem:** az ellenfél **bázisának életereje 0**, **vagy** az ellenfélnek **nincs egysége**.

## Gyártási költségek (fa / arany)

Új egységet a bázis melletti üres mezőre kapsz a gombokkal; a költség:

| Egység | Fa | Arany |
|--------|---:|------:|
| Bányász (B) | 2 | 1 |
| Katona (K) | 2 | 2 |
| Felderítő (F) | 1 | 2 |

## Hogyan kell játszani?

1. **Körök:** mindig az **aktuális játékos** lép (a bal/jobb panel jelzi: „Te jössz!”).
2. **Kiválasztás:** kattints a **saját** egységedre. A kijelölt mező kiemelődik; a pálya jelzi a **mozgásra** és (ahol lehet) a **támadásra** alkalmas mezőket.
3. **Mozgás:** kattints egy **oda léphető** üres vagy erőforrás mezőre.
4. **Gyűjtés:** ha a **bányász** erdőre vagy arany mezőre lép, **+3** megfelelő nyersanyagot kapsz, a mező kiürül. A mozgás **rövid animációval** történik.
5. **Támadás:** **katona** vagy **felderítő** kiválasztása után kattints egy **szomszédos ellenséges egységre**, vagy — ha mellette állsz — az **ellenséges bázis** mezőjére. A bányász nem támad.
6. **Gyártás:** a **Bányász / Katona / Felderítő gyártása** gombokkal új egységet hozol létre, ha van elég fa és arany (lásd fent: **Gyártási költségek**); az egység a **bázis melletti üres** mezőre kerül.
7. **Kör vége:** **Kör vége** gomb, vagy **Enter**. Ha lejár a **köridő**, a kör magától véget ér.
8. **Mentés / betöltés:** a játékállapot a böngésző **localStorage**-jébe menthető (**Mentés** / **Betöltés**).
9. **Beállítások:** **Téma váltás** (világos/sötét), **köridő** másodpercben a legördülőből.
10. **Súgó:** a **Súgó** gomb részletesebb leírást nyit (jQuery UI párbeszédablak).

## Projekt mappa

```
U4UFUK/
  index.html
  style.css
  main.js
```