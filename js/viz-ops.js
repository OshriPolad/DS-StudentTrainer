/* =========================================================================
   viz-ops.js — THE ANIMATION CONTENT (the frames for each operation).
   -------------------------------------------------------------------------
   Defines window.VIZ_OPERATIONS, which viz.js reads and plays.
   Each operation = { title, titleHe, frames:[ {caption, kind, model} ] }.
   Captions are in Hebrew (the app's language); code identifiers and Big-O
   notation stay as-is. Keeping content here (separate from the player in
   viz.js) means you can add/tweak an animation without touching the engine.

   Highlight colors:
     ACTIVE '#f59e0b' = הצומת/האיבר שנבחן כרגע
     GOOD   '#22c55e' = הוכנס / סופי
     PATH   '#6366f1' = על המסלול / בהשוואה
   ========================================================================= */

(function () {
  const ACTIVE = '#f59e0b', GOOD = '#22c55e', PATH = '#6366f1', WRONG = '#ef4444';

  const stack = (caption, values, highlight) =>
    ({ caption, kind: 'stack', model: { values: values.slice(), highlight: highlight || {} } });
  const list = (caption, values, pointers, highlight) =>
    ({ caption, kind: 'list', model: { nodes: values.map((v) => ({ val: v })), pointers: pointers || {}, highlight: highlight || {} } });
  const bars = (caption, values, highlight) =>
    ({ caption, kind: 'bars', model: { values: values.slice(), highlight: highlight || {} } });
  // array frame with index labels + pointer labels above ({index: 'front'} etc.)
  const arr = (caption, values, pointers, highlight) =>
    ({ caption, kind: 'array', model: { values: values.slice(), pointers: pointers || {}, highlight: highlight || {} } });
  function heap(caption, arr, highlight) {
    const nodes = {};
    arr.forEach((v, i) => {
      nodes[i] = { val: v, left: (2 * i + 1 < arr.length) ? 2 * i + 1 : null, right: (2 * i + 2 < arr.length) ? 2 * i + 2 : null };
    });
    return { caption, kind: 'tree', model: { nodes, root: arr.length ? 0 : null, highlight: highlight || {} } };
  }
  function bst(caption, nodes, root, highlight) {
    return { caption, kind: 'tree', model: { nodes, root, highlight: highlight || {} } };
  }

  /* 1) STACK */
  const stackOp = {
    title: 'מחסנית — הכנסה והוצאה (push & pop)', titleHe: 'Stack',
    frames: [
      stack('מחסנית עובדת בשיטת LIFO — הנכנס אחרון יוצא ראשון. היא מתחילה ריקה. הפעולות push, pop ו-top הן כולן O(1).', []),
      stack('push(5): הערך מונח על ראש המחסנית.', [5], { 0: GOOD }),
      stack('push(8): 8 מונח מעל 5.', [5, 8], { 1: GOOD }),
      stack('push(3): 3 מונח מעל. הראש (top) מחזיק תמיד את הערך האחרון שהוכנס.', [5, 8, 3], { 2: GOOD }),
      stack('top() מחזיר 3 — הערך האחרון שהוכנס — מבלי להסירו. O(1).', [5, 8, 3], { 2: ACTIVE }),
      stack('pop(): מסיר ומחזיר את הראש (3). רק מצביע הראש זז — O(1).', [5, 8], { 1: ACTIVE }),
      stack('pop() שוב: מסיר את 8. שימו לב שתמיד לוקחים קודם את הפריט החדש ביותר (LIFO).', [5], { 0: ACTIVE }),
      stack('המחסנית מכילה כעת רק [5]. כל פעולה נגעה רק בראש — O(1).', [5])
    ]
  };

  /* 2) LINKED LIST — insert at head */
  const listInsertOp = {
    title: 'רשימה מקושרת — הכנסה בראש', titleHe: 'Insert at head',
    frames: [
      list('רשימה מקושרת חד-כיוונית: כל צומת מצביע לצומת הבא. כאן head → 10 → 20 → ∅.', [10, 20], { head: 0 }),
      list('נרצה להכניס 5 בראש. תחילה יוצרים צומת חדש המחזיק 5.', [5, 10, 20], { newNode: 0, head: 1 }, { 0: GOOD }),
      list('מכוונים את המצביע next של הצומת החדש אל הראש הנוכחי (10).', [5, 10, 20], { newNode: 0, head: 1 }, { 0: GOOD, 1: PATH }),
      list('מזיזים את head לצומת החדש. סיימנו: head → 5 → 10 → 20.', [5, 10, 20], { head: 0 }, { 0: GOOD }),
      list('הכנסה בראש היא O(1) — מספר קבוע של שינויי מצביעים, ללא תלות באורך הרשימה.', [5, 10, 20], { head: 0 })
    ]
  };

  /* 3) LINKED LIST — traverse / search */
  const listTraverseOp = {
    title: 'רשימה מקושרת — מעבר וחיפוש', titleHe: 'Traverse',
    frames: [
      list('כדי למצוא ערך יש ללכת מהראש — אין גישה אקראית. נחפש את 9. מתחילים: curr מצביע על הראש.', [7, 4, 9, 2], { head: 0, curr: 0 }, {}),
      list('curr = 7. לא 9 → עוברים לצומת הבא.', [7, 4, 9, 2], { head: 0, curr: 0 }, { 0: ACTIVE }),
      list('curr = 4. לא 9 → ממשיכים.', [7, 4, 9, 2], { curr: 1 }, { 1: ACTIVE }),
      list('curr = 9. מצאנו! עוצרים כאן.', [7, 4, 9, 2], { curr: 2 }, { 2: GOOD }),
      list('במקרה הגרוע ביותר (הערך אינו קיים, או אחרון) עוברים על כל n הצמתים → החיפוש הוא O(n).', [7, 4, 9, 2], { head: 0 })
    ]
  };

  /* 4) BST — insert a sequence */
  const t1 = { 50: { val: 50, left: null, right: null } };
  const t2 = { 50: { val: 50, left: 30, right: null }, 30: { val: 30, left: null, right: null } };
  const t3 = { 50: { val: 50, left: 30, right: 70 }, 30: { val: 30, left: null, right: null }, 70: { val: 70, left: null, right: null } };
  const t4 = { 50: { val: 50, left: 30, right: 70 }, 30: { val: 30, left: 20, right: null }, 70: { val: 70, left: null, right: null }, 20: { val: 20, left: null, right: null } };
  const t5 = { 50: { val: 50, left: 30, right: 70 }, 30: { val: 30, left: 20, right: 40 }, 70: { val: 70, left: null, right: null }, 20: { val: 20, left: null, right: null }, 40: { val: 40, left: null, right: null } };
  const t6 = { 50: { val: 50, left: 30, right: 70 }, 30: { val: 30, left: 20, right: 40 }, 70: { val: 70, left: 60, right: null }, 20: { val: 20, left: null, right: null }, 40: { val: 40, left: null, right: null }, 60: { val: 60, left: null, right: null } };

  const bstInsertOp = {
    title: 'עץ חיפוש בינארי — הכנסה (בניית עץ)', titleHe: 'BST insert',
    frames: [
      bst('עץ חיפוש בינארי (BST) שומר מפתחות קטנים משמאל וגדולים מימין. מכניסים 50 → הוא הופך לשורש.', t1, 50, { 50: GOOD }),
      bst('מכניסים 30: משווים ל-50. 30 < 50 → פונים שמאלה. המקום השמאלי פנוי, אז מציבים שם את 30.', t2, 50, { 50: PATH, 30: GOOD }),
      bst('מכניסים 70: 70 > 50 → פונים ימינה. פנוי → מציבים את 70 כבן הימני.', t3, 50, { 50: PATH, 70: GOOD }),
      bst('מכניסים 20: 20 < 50 (שמאלה), ואז 20 < 30 (שמאלה). מציבים את 20 כבן השמאלי של 30.', t4, 50, { 50: PATH, 30: PATH, 20: GOOD }),
      bst('מכניסים 40: 40 < 50 (שמאלה), ואז 40 > 30 (ימינה). מציבים את 40 כבן הימני של 30.', t5, 50, { 50: PATH, 30: PATH, 40: GOOD }),
      bst('מכניסים 60: 60 > 50 (ימינה), ואז 60 < 70 (שמאלה). מציבים את 60 כבן השמאלי של 70.', t6, 50, { 50: PATH, 70: PATH, 60: GOOD }),
      bst('כל הכנסה עוקבת אחר מסלול יחיד משורש לעלה, ולכן עולה O(height) — O(log n) כשהעץ מאוזן.', t6, 50)
    ]
  };

  /* 5) BST — search */
  const bstSearchOp = {
    title: 'עץ חיפוש בינארי — חיפוש', titleHe: 'BST search',
    frames: [
      bst('מחפשים את 40 ב-BST הזה. מתחילים בשורש.', t6, 50, { 50: ACTIVE }),
      bst('40 < 50 → פונים שמאלה אל 30. (בכך דילגנו על כל תת-העץ הימני — זו העוצמה של BST.)', t6, 50, { 30: ACTIVE }),
      bst('40 > 30 → פונים ימינה אל 40.', t6, 50, { 40: ACTIVE }),
      bst('40 = 40 → נמצא! בדקנו רק 3 צמתים.', t6, 50, { 40: GOOD }),
      bst('החיפוש עוקב אחר מסלול יחיד כלפי מטה, ולכן הוא O(height): O(log n) במאוזן, O(n) במקרה גרוע (עץ מנוון).', t6, 50)
    ]
  };

  /* 6) MIN-HEAP — insert (sift up) */
  const heapInsertOp = {
    title: 'ערמת מינימום — הכנסה (ניפוי כלפי מעלה)', titleHe: 'Min-heap insert',
    frames: [
      heap('ערמת מינימום: כל אב ≤ בניו, ולכן המינימום נמצא תמיד בשורש. מכניסים 5.', [10, 20, 15, 30, 25]),
      heap('מוסיפים את 5 במקום הפנוי הבא (סוף המערך), כבן של 15.', [10, 20, 15, 30, 25, 5], { 5: GOOD }),
      heap('משווים את 5 לאביו 15. 5 < 15 → מחליפים ביניהם (ניפוי כלפי מעלה).', [10, 20, 5, 30, 25, 15], { 2: ACTIVE, 5: ACTIVE }),
      heap('כעת אביו של 5 הוא השורש 10. 5 < 10 → מחליפים שוב.', [5, 20, 10, 30, 25, 15], { 0: ACTIVE, 2: ACTIVE }),
      heap('5 הוא כעת השורש ואינו קטן מאף אב → עוצרים. המינימום החדש הוא 5.', [5, 20, 10, 30, 25, 15], { 0: GOOD }),
      heap('הניפוי כלפי מעלה עובר לכל היותר את גובה העץ, ולכן ההכנסה היא O(log n).', [5, 20, 10, 30, 25, 15])
    ]
  };

  /* 7) MIN-HEAP — extract-min (sift down) */
  const heapExtractOp = {
    title: 'ערמת מינימום — הוצאת מינימום (ניפוי כלפי מטה)', titleHe: 'Min-heap extract',
    frames: [
      heap('המינימום נמצא בשורש (5). extract-min() מחזיר אותו — אך תחילה יש לתקן את הערמה.', [5, 10, 15, 30, 25, 20], { 0: ACTIVE }),
      heap('מסירים את השורש, ואז מעבירים את האיבר האחרון (20) למקום השורש.', [20, 10, 15, 30, 25], { 0: ACTIVE }),
      heap('משווים את 20 לבניו 10 ו-15. הקטן ביותר הוא 10, ו-10 < 20 → מחליפים (ניפוי כלפי מטה).', [10, 20, 15, 30, 25], { 0: ACTIVE, 1: ACTIVE }),
      heap('כעת בניו של 20 הם 30 ו-25 — שניהם גדולים מ-20 → עוצרים.', [10, 20, 15, 30, 25], { 1: GOOD }),
      heap('הערמה תקינה שוב, כאשר 10 הוא המינימום החדש. extract-min היא O(log n).', [10, 20, 15, 30, 25], { 0: GOOD })
    ]
  };

  /* 8) BUBBLE SORT */
  function bubbleSortFrames() {
    const a = [5, 2, 4, 1, 3];
    const frames = [bars('מיון בועות: משווים שוב ושוב זוגות סמוכים ומחליפים אם אינם בסדר. ערכים גדולים "מבעבעים" אל הסוף.', a)];
    const arr = a.slice();
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        frames.push(bars('משווים את המקומות ' + j + ' ו-' + (j + 1) + ': ' + arr[j] + ' מול ' + arr[j + 1] + '.',
          arr, { [j]: ACTIVE, [j + 1]: ACTIVE }));
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          frames.push(bars(arr[j + 1] + ' > ' + arr[j] + ' → מחליפים ביניהם.', arr, { [j]: GOOD, [j + 1]: GOOD }));
        }
      }
      const sortedHl = {};
      for (let k = n - 1 - i; k < n; k++) sortedHl[k] = GOOD;
      frames.push(bars('סוף מעבר ' + (i + 1) + ': הערך הלא-ממוין הגדול ביותר "חנה" כעת מימין (ממוין).', arr, sortedHl));
    }
    frames.push(bars('ממוין! מיון בועות הוא O(n²) במקרה הגרוע — n מעברים, כל אחד סורק עד n איברים.', arr,
      arr.reduce((h, _, k) => (h[k] = GOOD, h), {})));
    return frames;
  }
  const bubbleOp = { title: 'מיון בועות', titleHe: 'Bubble sort', frames: bubbleSortFrames() };

  /* 9) QUEUE — enqueue & dequeue (FIFO) */
  const queueOp = {
    title: 'תור — הכנסה והוצאה (enqueue & dequeue)', titleHe: 'Queue',
    frames: [
      arr('תור עובד בשיטת FIFO — הנכנס ראשון יוצא ראשון. מוסיפים בזנב (rear), מוציאים מהראש (front).', [10], { 0: 'front / rear' }, { 0: GOOD }),
      arr('enqueue(20): האיבר החדש נוסף בזנב. front נשאר על הוותיק ביותר.', [10, 20], { 0: 'front', 1: 'rear' }, { 1: GOOD }),
      arr('enqueue(30): שוב נוסף בזנב. הסדר נשמר: 10 נכנס ראשון ולכן יֵצא ראשון.', [10, 20, 30], { 0: 'front', 2: 'rear' }, { 2: GOOD }),
      arr('dequeue(): מוציאים את הראש (10) — הוותיק ביותר. front מתקדם ל-20.', [20, 30], { 0: 'front', 1: 'rear' }, { 0: ACTIVE }),
      arr('dequeue(): מוציאים 20. תמיד יוצא מי שנכנס ראשון (FIFO).', [30], { 0: 'front / rear' }, { 0: ACTIVE }),
      arr('נשאר 30. כל enqueue וכל dequeue נגעו רק בקצה אחד → O(1).', [30], { 0: 'front / rear' }, {})
    ]
  };

  /* 10) CIRCULAR QUEUE — the pointers wrap around with % m */
  const E = '·';
  const circularQueueOp = {
    title: 'תור מעגלי — עטיפה עם מודולו (%)', titleHe: 'Circular queue',
    frames: [
      arr('תור מעגלי במערך בגודל 5. כשמצביע מגיע לסוף הוא "עוטף" חזרה ל-0 בעזרת % 5. נתחיל למלא.', [E, E, E, E, E], { 0: 'front / rear' }, {}),
      arr('enqueue(A), enqueue(B), enqueue(C): כל אחד נוסף במקום rear, ו-rear מתקדם.', ['A', 'B', 'C', E, E], { 0: 'front', 3: 'rear' }, { 0: GOOD, 1: GOOD, 2: GOOD }),
      arr('dequeue() פעמיים: front מתקדם ומדלג על A ואז B. המשבצות 0,1 מתפנות.', [E, E, 'C', E, E], { 2: 'front', 3: 'rear' }, { 2: ACTIVE }),
      arr('enqueue(D), enqueue(E): D נכתב במשבצת 3 ו-E במשבצת 4. כעת (4+1) % 5 = 0, ולכן rear עוטף חזרה למשבצת 0 שהתפנתה.', [E, E, 'C', 'D', 'E'], { 2: 'front', 0: 'rear' }, { 3: GOOD, 4: GOOD }),
      arr('enqueue(F): rear כבר מצביע על משבצת 0 (שהתפנתה) → F נכתב שם. כך המערך מתנהג כמו טבעת ולא מבזבז מקום.', ['F', E, 'C', 'D', 'E'], { 2: 'front', 1: 'rear' }, { 0: GOOD }),
      arr('זה הכוח של התור המעגלי: המערך מתנהג כמו טבעת, וכל פעולה נשארת O(1).', ['F', E, 'C', 'D', 'E'], { 2: 'front', 1: 'rear' }, {})
    ]
  };

  /* 11) DYNAMIC ARRAY — growth by doubling (amortized O(1)) */
  const dynArrayOp = {
    title: 'מערך דינמי — הכפלת קיבולת (זמן משוערך)', titleHe: 'Dynamic array',
    frames: [
      arr('מערך דינמי מנהל קיבולת (capacity). נתחיל עם קיבולת 2, גודל 0. push_back מוסיף בסוף.', [E, E], { 0: 'capacity=2' }, {}),
      arr('push_back(5): נכתב במשבצת הפנויה. size=1. O(1).', [5, E], {}, { 0: GOOD }),
      arr('push_back(8): size=2 — עכשיו המערך מלא (size = capacity).', [5, 8], {}, { 1: GOOD }),
      arr('push_back(3): מלא! מכפילים ל-capacity=4, מעתיקים את 5 ו-8 למערך החדש (O(n))...', [5, 8, E, E], { 0: 'הועתק', 1: 'הועתק' }, { 0: ACTIVE, 1: ACTIVE }),
      arr('...ואז כותבים את 3. size=3. ההעתקה היקרה קורית רק כשמתמלאים.', [5, 8, 3, E], {}, { 2: GOOD }),
      arr('push_back(1): יש מקום → O(1). size=4, שוב מלא.', [5, 8, 3, 1], {}, { 3: GOOD }),
      arr('push_back(9): מכפילים ל-8, מעתיקים, ומוסיפים. ההכפלות נדירות, ולכן הממוצע לכל הכנסה הוא O(1) משוערך.', [5, 8, 3, 1, 9, E, E, E], {}, { 4: GOOD })
    ]
  };

  /* 12) BINARY SEARCH — lo / mid / hi on a sorted array */
  const A = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  const binarySearchOp = {
    title: 'חיפוש בינארי — מחפשים 23', titleHe: 'Binary search',
    frames: [
      arr('מערך ממוין. מחפשים את 23. חיפוש בינארי מסתכל תמיד באמצע ומוותר על חצי מהמערך בכל צעד.', A, { 0: 'lo', 9: 'hi' }, {}),
      arr('mid = 0 + (9-0)/2 = 4 → הערך 16. משווים: 23 > 16 → נלך לחצי הימני.', A, { 0: 'lo', 4: 'mid', 9: 'hi' }, { 4: ACTIVE }),
      arr('מזיזים lo ל-5 (מיד ימינה). התחום הימני בלבד נשאר. mid = 5 + (9-5)/2 = 7 → 56.', A, { 5: 'lo', 7: 'mid', 9: 'hi' }, { 7: ACTIVE }),
      arr('23 < 56 → נלך לחצי השמאלי של התחום. מזיזים hi ל-6. mid = 5 + (6-5)/2 = 5 → 23.', A, { 5: 'lo / mid', 6: 'hi' }, { 5: ACTIVE }),
      arr('23 = 23 → נמצא באינדקס 5! בדקנו רק 3 איברים במקום 10 → O(log n).', A, { 5: 'found' }, { 5: GOOD })
    ]
  };

  /* 13) AVL — single right rotation (LL case) */
  const avlLL1 = { 30: { val: 30, left: 20, right: null }, 20: { val: 20, left: 10, right: null }, 10: { val: 10, left: null, right: null } };
  const avlLL2 = { 20: { val: 20, left: 10, right: 30 }, 10: { val: 10, left: null, right: null }, 30: { val: 30, left: null, right: null } };
  const avlSingleOp = {
    title: 'AVL — רוטציה בודדת (מקרה LL)', titleHe: 'AVL single rotation',
    frames: [
      bst('אחרי הכנסת 10, הצומת 30 אינו מאוזן: מקדם האיזון שלו הוא +2 (כבד משמאל). זהו מקרה LL — כבד שמאל-שמאל.', avlLL1, 30, { 30: WRONG, 20: PATH, 10: PATH }),
      bst('הפתרון למקרה LL: רוטציה ימנית בודדת סביב 30. הבן השמאלי 20 יעלה להיות השורש.', avlLL1, 30, { 30: WRONG, 20: ACTIVE }),
      bst('בוצעה רוטציה ימנית: 20 הוא השורש, 10 בן שמאלי, 30 בן ימני. העץ מאוזן שוב.', avlLL2, 20, { 20: GOOD }),
      bst('הגובה ירד מ-3 ל-2, וכל צומת שוב בתחום איזון {-1,0,+1}. כלל: כבד משמאל ⇒ מסובבים ימינה.', avlLL2, 20, {})
    ]
  };

  /* 14) AVL — double rotation (LR case) */
  const avlLR1 = { 30: { val: 30, left: 10, right: null }, 10: { val: 10, left: null, right: 20 }, 20: { val: 20, left: null, right: null } };
  const avlLR2 = { 30: { val: 30, left: 20, right: null }, 20: { val: 20, left: 10, right: null }, 10: { val: 10, left: null, right: null } };
  const avlLR3 = { 20: { val: 20, left: 10, right: 30 }, 10: { val: 10, left: null, right: null }, 30: { val: 30, left: null, right: null } };
  const avlDoubleOp = {
    title: 'AVL — רוטציה כפולה (מקרה LR)', titleHe: 'AVL double rotation',
    frames: [
      bst('30 כבד משמאל, אבל ההכנסה (20) היא בתת-העץ הימני של הבן השמאלי — זהו מקרה LR. רוטציה בודדת לא תספיק.', avlLR1, 30, { 30: WRONG, 10: PATH, 20: PATH }),
      bst('שלב 1: רוטציה שמאלית על הבן 10. 20 עולה מעל 10, והמצב הופך למקרה LL "רגיל".', avlLR2, 30, { 20: ACTIVE, 30: WRONG }),
      bst('שלב 2: כעת זה LL — רוטציה ימנית על 30. 20 הופך לשורש.', avlLR3, 20, { 20: GOOD }),
      bst('מאוזן! מקרי LR ו-RL תמיד דורשים שתי רוטציות: קודם על הבן, ואז על הצומת.', avlLR3, 20, {})
    ]
  };

  // stable ids so the Learn Journey can reference animations by name
  stackOp.id = 'stack'; queueOp.id = 'queue'; circularQueueOp.id = 'circular-queue';
  listInsertOp.id = 'list-insert'; listTraverseOp.id = 'list-traverse';
  dynArrayOp.id = 'dyn-array'; binarySearchOp.id = 'binary-search';
  bstInsertOp.id = 'bst-insert'; bstSearchOp.id = 'bst-search';
  avlSingleOp.id = 'avl-single'; avlDoubleOp.id = 'avl-double';
  heapInsertOp.id = 'heap-insert'; heapExtractOp.id = 'heap-extract'; bubbleOp.id = 'bubble';

  window.VIZ_OPERATIONS = [
    stackOp, queueOp, circularQueueOp, listInsertOp, listTraverseOp,
    dynArrayOp, binarySearchOp,
    bstInsertOp, bstSearchOp, avlSingleOp, avlDoubleOp,
    heapInsertOp, heapExtractOp, bubbleOp
  ];
})();
