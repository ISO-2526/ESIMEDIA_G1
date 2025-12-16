package grupo1.esimedia;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.Test;

import grupo1.esimedia.accounts.model.Admin;
import grupo1.esimedia.accounts.model.Department;

class AdminTest {

    @Test
    void departmentGetterSetter_shouldStoreAndReturnValue() {
        Admin admin = new Admin();
        assertNull(admin.getDepartment(), "Por defecto department debe ser null");

        admin.setDepartment(Department.DATA_ANALYTICS);
        assertEquals(Department.DATA_ANALYTICS, admin.getDepartment());
    }

    @Test
    void pictureGetterSetter_shouldStoreAndReturnValue() {
        Admin admin = new Admin();
        assertNull(admin.getPicture(), "Por defecto picture debe ser null");

        String pic = "avatar1.png";
        admin.setPicture(pic);
        assertEquals(pic, admin.getPicture());
    }
}
