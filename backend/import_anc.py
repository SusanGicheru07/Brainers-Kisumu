import pandas as pd
from django.conf import settings
import django
import os


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")  
django.setup()

from apps.hospital.models import Hospital, ANCRecord

def import_anc_data(excel_file):
    df = pd.read_excel(excel_file, sheet_name="Sheet1")

    for _, row in df.iterrows():
        hospital, _ = Hospital.objects.get_or_create(
            name=row["organisationunitname"],
            county=row["orgunitlevel2"],
            sub_county=row["orgunitlevel3"],
            ward=row["orgunitlevel4"]
        )

        ANCRecord.objects.create(
            hospital=hospital,
            periodname=row["periodname"],
            new_anc_clients = row["New ANC clients"],
            cervical_cancer=row["Cervical Cancer"],
            iron_folate_supplements=row["IronFolate_supplements"],
            iron_supplements=row["Iron_supplements"],
            folic_supplements=row["Folic_supplements"],
            preg_adol_15_19_first_anc=row["Preg_Adol_15-19_1stANC"],
            completed_4anc=row["Completed_4ANC"],
            re_visit_anc_clients=row["Re-Visit ANC clients"],
            ipt_3rd_dose=row["IPT 3rd Dose"],
            first_anc_before_12_weeks=row["1stANC <= 12 wks"],
            completed_8anc=row["Completed 8ANC"],
            fgm_complications=row["FGM_Complications"],
            preg_youth_20_24=row["Preg_youth_20-24"],
            breast_cancer_screened=row["Breast cancer screened"],
            cervical_cancer_screened=row["Cervical cancer screened"]
        )

    print("✅ Import completed successfully!")


if __name__ == "__main__":
    import_anc_data("ANC.xlsx") 
