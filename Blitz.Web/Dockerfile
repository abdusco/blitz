FROM mcr.microsoft.com/dotnet/sdk:5.0 as builder

WORKDIR /app

COPY *.csproj .
RUN dotnet restore

COPY . ./
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:5.0 as app

WORKDIR /app
COPY --from=builder /app/out .
ENTRYPOINT ["dotnet", "Blitz.Web.dll"]