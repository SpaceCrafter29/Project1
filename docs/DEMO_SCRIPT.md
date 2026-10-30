# Demo video script (about 3.5 minutes)

Record with the real Meta API if possible; demo mode (`MODEL_PROVIDER=mock`) follows exactly the same flow and is a safe fallback. Use the sample images in `public/samples/` or your own photos.

## 0:00 – The problem (20 s)
"Olympiad training apps either give you the solution or nothing. Olympiad Coach guides you to *your own* proof – and it never claims you are wrong without proof."

Show the home page and click **New problem**.

## 0:20 – Upload and confirm (20 s)
Paste a screenshot of IMO 1964 Problem 1. The coach transcribes it and asks: *Did I read this correctly?* Point out that nothing is judged until you confirm.

## 0:40 – The tip loop (35 s)
The first tip appears by itself: "work with remainders". It comes with a table that code computed in the browser, not the model. Show a photo of unfinished work (remainders 2, 4, 1, … and a conjecture) and confirm what was read. The next tip starts from *your* work: "You computed the remainders and stated a conjecture" (code tested it for 5000 values), then "a pattern is not a proof yet". Write "I still don't see why it repeats" and ask again without a photo: the tip gets more concrete (compare $2^{n+3}$ with $2^n$), but it still doesn't give the answer away.

## 1:15 – Handwritten solution (15 s)
Photograph the handwritten solution. Show the recognized steps next to the photo and fix a reading error, if there is one.

## 1:30 – Verified feedback (40 s)
- Step 2 is a **gap**: the pattern is true (the code check confirms it), but the reason is missing.
- Step 5 is an **error**: the code found a counterexample. Say: "7 is odd and divisible by 7 – checked, not guessed."
- Step 3 is **unclear**: the first reviewer criticized it, but an independent second check could not confirm the critique, so the app does not call it wrong.
- Click **I think my step is right** on step 3 and explain. The coach answers: "You are right, I overlooked …". The score rises from 3–4 to 4.

## 2:10 – Pen and repair (25 s)
Circle step 2 on the photo, then tap **Explain this**. On **Fix your approach**, show the card for part (b): it breaks at step 5, with the repair hints revealed in two levels.

## 2:35 – Learn other approaches (25 s)
Open **Other approaches** and walk through the three ideas:
- **Reducing exponents:** a full solution with a justification for every step. Click **That's not right?** on a step to show the re-check.
- **Induction:** marked "only logically checked".
- **Factorization:** the code caught a wrong result, so no solution is shown. Say: "verification is the default, not a feature badge."

## 3:00 – Geometry (25 s)
Start a new problem from the geometry sample. Point out that the figure is described in words and confirmed like the text. In **Small cases & experiments**, drag a corner of the quadrilateral: the areas change, but area MNPQ stays exactly half of area ABCD. On the handwritten solution, the claim "area = MN · NP" is refuted by a concrete quadrilateral that code found among 2000 random ones.

## 3:25 – Close (10 s)
"Paper and pen for thinking, AI for coaching, code for checking. Olympiad Coach."
