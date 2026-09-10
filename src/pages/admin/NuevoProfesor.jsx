import { useParams } from "react-router-dom";
import FichaProfesor from "../../components/admin/FichaProfesor";

export default function NuevoProfesor() {
  const { id } = useParams();

  return (
    <>
      <FichaProfesor profesorId={id} />
    </>
  );
}
