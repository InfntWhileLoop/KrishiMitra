#!/usr/bin/env python3
import numpy as np
import pandas as pd

states = ["UTTAR PRADESH", "RAJASTHAN", "MADHYA PRADESH"]
districts = ["JAIPUR", "LUCKNOW", "INDORE"]
years = list(range(2000, 2006))

rows = []
for s in states:
	for d in districts:
		for y in years:
			rows.append({
				"state": s,
				"district": d,
				"year": y,
				"JAN_TEMP": 18 + np.random.normal(0, 3),
				"JUL_TEMP": 30 + np.random.normal(0, 3),
				"JAN_RAIN": 10 + np.random.exponential(5),
				"JUL_RAIN": 200 + np.random.exponential(40),
				"JAN_HUMID": 60 + np.random.normal(0, 8),
				"JUL_HUMID": 80 + np.random.normal(0, 8),
			})

pd.DataFrame(rows).to_csv("sample_climate_data.csv", index=False)
print("Wrote sample_climate_data.csv")
