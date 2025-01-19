import React, { useState, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Paper,
  Box,
  Button,
  TextField,
  Snackbar,
  Alert,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { getSteamData } from "./services/steam.service";

function App() {
  const [data, setData] = useState([]);
  const [hasMoreGames, setHasMoreGames] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [maxPlayedTime, setMaxPlayedTime] = useState(100);
  const [includeMostPlayed, setIncludeMostPlayed] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [paginationModel, setPaginationModel] = React.useState({
    page: 0,
    pageSize: 100,
  });
  const [steamId, setSteamId] = useState("");
  const fetchData = async (steamIdValue, page = 1) => {
    setIsLoading(true);
    try {
      console.log(includeMostPlayed);
      const params = {
        steamid: steamIdValue,
        maxTime: maxPlayedTime,
        format: "json",
        mostPlayed: includeMostPlayed,
        page,
      };

      const response = await getSteamData(params);
      const newGames = response.games || [];

      if (page === 1) {
        setData(newGames.slice(0, 20));
      } else {
        setData((prevData) => {
          const existingIds = new Set(prevData.map((game) => game.appid));
          const filteredNewGames = newGames.filter(
            (game) => !existingIds.has(game.appid)
          );
          return [...prevData, ...filteredNewGames];
        });

        if (newGames.length === 0) {
          setHasMoreGames(false);
        }
      }
    } catch (error) {
      console.error("Error fetching game data:", error.message);
      if (error.response?.status === 404) {
        setAlertMessage("Steam ID not found or the profile is private.");
        setAlertOpen(true);
      } else {
        setAlertMessage("An unexpected error occurred.");
        setAlertOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    fetchData(steamId, currentPage + 1);
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handleSteamIdChange = (e) => {
    setSteamId(e.target.value);
  };

  const handleMaxPlayedTimeChange = (e) => {
    setMaxPlayedTime(e.target.value);
  };

  const handleIncludeMostPlayedChange = (e) => {
    setIncludeMostPlayed(e.target.checked);
  };
  const handleSteamIdSubmit = () => {
    setCurrentPage(1);
    setHasMoreGames(true);
    fetchData(steamId, 1);
  };
  const rows = useMemo(() => {
    const { page, pageSize } = paginationModel;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;

    return data.slice(startIndex, endIndex).map((game) => ({
      id: game.appid,
      name: game.name,
      img_icon_url: game.img_icon_url,
      playtime_forever: game.playtime_forever,
      metacritic: game.metacritic || "--",
      main_time: game.main_time,
    }));
  }, [data, paginationModel]);
  const rowCount = useMemo(() => data.length, [data]);
  const handleAlertClose = () => {
    setAlertOpen(false);
  };
  const columns = [
    {
      field: "image",
      headerName: "",
      width: 100,
      renderCell: (params) => (
        <img
          src={`https://media.steampowered.com/steamcommunity/public/images/apps/${params.row.id}/${params.row.img_icon_url}.jpg`}
          //src={params.row.capsule_image}
          alt={params.row.name}
          style={{ width: 50, height: 50 }}
        />
      ),
      sortable: false,
    },
    { field: "name", headerName: "Game", width: 200 },
    {
      field: "metacritic",
      headerName: "Metacritic score",
      width: 150,
      sortComparator: (v1, v2) => {
        const score1 = v1 === "--" ? -Infinity : Number(v1);
        const score2 = v2 === "--" ? -Infinity : Number(v2);
        return score1 - score2;
      },
      renderCell: (params) => {
        const score = params.value;

        let backgroundColor = "";
        if (score >= 80) {
          backgroundColor = "rgba(0, 128, 0, 0.2)";
        } else if (score >= 69) {
          backgroundColor = "rgba(255, 165, 0, 0.2)";
        } else {
          backgroundColor = "rgba(255, 0, 0, 0.2)";
        }

        return (
          <div
            style={{
              backgroundColor,
              color: "black",
              borderRadius: "4px",
              padding: "5px",
              textAlign: "center",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            {score}
          </div>
        );
      },
    },
    {
      field: "playtime_forever",
      headerName: "Played Time (minutes)",
      width: 200,
      align: "right",
    },

    /*{
      field: "main_time",
      headerName: "Main Story",
      align: "right",
    },*/
  ];

  return (
    <Box sx={{ height: 800, width: "100%", display: "flex", gap: 2 }}>
      <Paper sx={{ width: "40%", height: "90%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2 }}>
          <TextField
            label="Steam ID"
            variant="outlined"
            value={steamId}
            onChange={handleSteamIdChange}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleSteamIdSubmit}
            disabled={isLoading}
          >
            Fetch Games
          </Button>
        </Box>
        <DataGrid
          rows={rows}
          columns={columns}
          paginationMode="client"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25, 100]}
          hideFooterPagination
          autoWidth
          loading={isLoading}
        />
        <Box
          sx={{
            p: 2,
            textAlign: "left",
            display: "flex",
            justifyContent: "flex-start",
          }}
        >
          {hasMoreGames && (
            <Button
              variant="contained"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load More Games"}
            </Button>
          )}
          {!hasMoreGames && <p>No more games to load.</p>}
        </Box>
      </Paper>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <FormControlLabel
          sx={{ maxWidth: "250px" }}
          control={
            <Checkbox
              checked={includeMostPlayed}
              onChange={handleIncludeMostPlayedChange}
            />
          }
          label="Ignore time limit"
        />
        <TextField
          sx={{ maxWidth: "250px" }}
          label="Maximum Played Time (minutes)"
          type="number"
          value={maxPlayedTime}
          onChange={handleMaxPlayedTimeChange}
          disabled={includeMostPlayed}
        />
      </Box>
      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleAlertClose}
      >
        <Alert
          onClose={handleAlertClose}
          severity="error"
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
